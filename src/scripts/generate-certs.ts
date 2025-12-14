/**
 * 开发环境 SSL 证书生成脚本
 * 在 postinstall 时自动生成自签名证书用于本地 HTTPS/HTTP2
 *
 * 注意: 这些证书仅用于开发环境！
 * 生产环境应使用 Let's Encrypt 或商业 CA 颁发的证书
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { generateKeyPairSync, createSign, createHash } from 'crypto'

const CERTS_DIR = join(process.cwd(), 'certs')
const CERT_FILE = join(CERTS_DIR, 'server.crt')
const KEY_FILE = join(CERTS_DIR, 'server.key')

// 证书有效期 (天)
const VALIDITY_DAYS = 365

/**
 * 检查证书是否已存在且有效
 */
function certsExist(): boolean {
  return existsSync(CERT_FILE) && existsSync(KEY_FILE)
}

/**
 * ASN.1 DER 编码辅助函数
 */
function encodeLength(length: number): Buffer {
  if (length < 128) {
    return Buffer.from([length])
  } else if (length < 256) {
    return Buffer.from([0x81, length])
  } else if (length < 65536) {
    return Buffer.from([0x82, (length >> 8) & 0xff, length & 0xff])
  }
  throw new Error('Length too large')
}

function encodeSequence(contents: Buffer): Buffer {
  const len = encodeLength(contents.length)
  return Buffer.concat([Buffer.from([0x30]), len, contents])
}

function encodeSet(contents: Buffer): Buffer {
  const len = encodeLength(contents.length)
  return Buffer.concat([Buffer.from([0x31]), len, contents])
}

function encodeInteger(value: Buffer | number): Buffer {
  let buf: Buffer
  if (typeof value === 'number') {
    if (value < 128) {
      buf = Buffer.from([value])
    } else {
      const bytes: number[] = []
      let v = value
      while (v > 0) {
        bytes.unshift(v & 0xff)
        v = v >> 8
      }
      if (bytes[0]! >= 128) bytes.unshift(0)
      buf = Buffer.from(bytes)
    }
  } else {
    buf = value[0]! >= 128 ? Buffer.concat([Buffer.from([0]), value]) : value
  }
  const len = encodeLength(buf.length)
  return Buffer.concat([Buffer.from([0x02]), len, buf])
}

function encodeOID(oid: string): Buffer {
  const parts = oid.split('.').map(Number)
  const bytes: number[] = [parts[0]! * 40 + parts[1]!]

  for (let i = 2; i < parts.length; i++) {
    let value = parts[i]!
    if (value < 128) {
      bytes.push(value)
    } else {
      const encoded: number[] = []
      while (value > 0) {
        encoded.unshift((value & 0x7f) | (encoded.length > 0 ? 0x80 : 0))
        value = value >> 7
      }
      bytes.push(...encoded)
    }
  }

  const buf = Buffer.from(bytes)
  return Buffer.concat([Buffer.from([0x06]), encodeLength(buf.length), buf])
}

function encodePrintableString(str: string): Buffer {
  const buf = Buffer.from(str, 'ascii')
  return Buffer.concat([Buffer.from([0x13]), encodeLength(buf.length), buf])
}

function encodeUTF8String(str: string): Buffer {
  const buf = Buffer.from(str, 'utf8')
  return Buffer.concat([Buffer.from([0x0c]), encodeLength(buf.length), buf])
}

function encodeUTCTime(date: Date): Buffer {
  const str =
    date
      .toISOString()
      .replace(/[-:T]/g, '')
      .slice(2, 14) + 'Z'
  const buf = Buffer.from(str, 'ascii')
  return Buffer.concat([Buffer.from([0x17]), encodeLength(buf.length), buf])
}

function encodeBitString(bits: Buffer): Buffer {
  const content = Buffer.concat([Buffer.from([0]), bits])
  return Buffer.concat([Buffer.from([0x03]), encodeLength(content.length), content])
}

function encodeContextTag(tag: number, content: Buffer): Buffer {
  const tagByte = 0xa0 | tag
  return Buffer.concat([Buffer.from([tagByte]), encodeLength(content.length), content])
}

function encodeOctetString(content: Buffer): Buffer {
  return Buffer.concat([Buffer.from([0x04]), encodeLength(content.length), content])
}

/**
 * 创建 X.509 v3 自签名证书
 */
function createSelfSignedCertificate(): { cert: string; key: string } {
  console.log('🔐 Generating development SSL certificate...')

  // 生成 RSA 密钥对
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  })

  // 导出密钥
  const privateKeyPem = privateKey.export({ type: 'pkcs1', format: 'pem' }) as string
  const publicKeyDer = publicKey.export({ type: 'spki', format: 'der' }) as Buffer

  // 构建证书主题
  const buildName = (cn: string): Buffer => {
    const cnAttr = encodeSequence(
      Buffer.concat([
        encodeOID('2.5.4.3'), // commonName
        encodeUTF8String(cn),
      ]),
    )
    const oAttr = encodeSequence(
      Buffer.concat([
        encodeOID('2.5.4.10'), // organizationName
        encodePrintableString('Prexis Development'),
      ]),
    )
    const cAttr = encodeSequence(
      Buffer.concat([
        encodeOID('2.5.4.6'), // countryName
        encodePrintableString('CN'),
      ]),
    )

    return encodeSequence(Buffer.concat([encodeSet(cAttr), encodeSet(oAttr), encodeSet(cnAttr)]))
  }

  const issuerName = buildName('Prexis Dev CA')
  const subjectName = buildName('localhost')

  // 有效期
  const notBefore = new Date()
  const notAfter = new Date()
  notAfter.setDate(notAfter.getDate() + VALIDITY_DAYS)

  // 序列号 (随机)
  const serialNumber = Buffer.from(createHash('sha256').update(Date.now().toString()).digest().slice(0, 8))

  // 构建 TBS (To Be Signed) Certificate
  const version = encodeContextTag(0, encodeInteger(2)) // v3
  const serial = encodeInteger(serialNumber)
  const signatureAlgorithm = encodeSequence(
    Buffer.concat([
      encodeOID('1.2.840.113549.1.1.11'), // sha256WithRSAEncryption
      Buffer.from([0x05, 0x00]), // NULL
    ]),
  )
  const validity = encodeSequence(Buffer.concat([encodeUTCTime(notBefore), encodeUTCTime(notAfter)]))
  const subjectPublicKeyInfo = publicKeyDer

  // 扩展
  // Subject Alternative Name: localhost, 127.0.0.1, ::1
  const sanDnsName = (name: string): Buffer => {
    const buf = Buffer.from(name, 'ascii')
    return Buffer.concat([Buffer.from([0x82]), encodeLength(buf.length), buf])
  }
  const sanIpAddress = (ip: number[]): Buffer => {
    const buf = Buffer.from(ip)
    return Buffer.concat([Buffer.from([0x87]), encodeLength(buf.length), buf])
  }

  const sanExtension = encodeSequence(
    Buffer.concat([
      encodeOID('2.5.29.17'), // subjectAltName
      encodeOctetString(
        encodeSequence(
          Buffer.concat([
            sanDnsName('localhost'),
            sanIpAddress([127, 0, 0, 1]),
            sanIpAddress([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]), // ::1
          ]),
        ),
      ),
    ]),
  )

  // Basic Constraints: CA:FALSE
  const basicConstraints = encodeSequence(
    Buffer.concat([
      encodeOID('2.5.29.19'),
      Buffer.from([0x01, 0x01, 0xff]), // critical
      encodeOctetString(encodeSequence(Buffer.from([]))),
    ]),
  )

  // Key Usage: digitalSignature, keyEncipherment
  const keyUsage = encodeSequence(
    Buffer.concat([
      encodeOID('2.5.29.15'),
      Buffer.from([0x01, 0x01, 0xff]), // critical
      encodeOctetString(encodeBitString(Buffer.from([0xa0]))),
    ]),
  )

  const extensions = encodeContextTag(3, encodeSequence(Buffer.concat([basicConstraints, keyUsage, sanExtension])))

  const tbsCertificate = encodeSequence(
    Buffer.concat([version, serial, signatureAlgorithm, issuerName, validity, subjectName, subjectPublicKeyInfo, extensions]),
  )

  // 签名
  const sign = createSign('SHA256')
  sign.update(tbsCertificate)
  const signature = sign.sign(privateKey)

  // 完整证书
  const certificate = encodeSequence(Buffer.concat([tbsCertificate, signatureAlgorithm, encodeBitString(signature)]))

  // 转换为 PEM
  const certPem =
    '-----BEGIN CERTIFICATE-----\n' + certificate.toString('base64').match(/.{1,64}/g)!.join('\n') + '\n-----END CERTIFICATE-----\n'

  console.log('✅ Certificate generated successfully')
  console.log(`   📁 Certificate: ${CERT_FILE}`)
  console.log(`   🔑 Private Key: ${KEY_FILE}`)
  console.log(`   ⏱️  Valid for: ${VALIDITY_DAYS} days`)
  console.log('')
  console.log('   ⚠️  This is a self-signed certificate for development only!')
  console.log('   ⚠️  Your browser will show a security warning.')

  return { cert: certPem, key: privateKeyPem }
}

/**
 * 主函数
 */
function main(): void {
  // 仅在开发环境生成证书
  if (process.env.NODE_ENV === 'prod') {
    console.log('⏭️  Skipping certificate generation in prod')
    return
  }

  if (certsExist()) {
    console.log('✅ Development certificates already exist')
    return
  }

  // 创建证书目录
  if (!existsSync(CERTS_DIR)) {
    mkdirSync(CERTS_DIR, { recursive: true })
  }

  // 生成证书
  const { cert, key } = createSelfSignedCertificate()

  // 保存文件
  writeFileSync(CERT_FILE, cert)
  writeFileSync(KEY_FILE, key)
}

main()
