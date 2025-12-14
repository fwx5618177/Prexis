export class HttpException extends Error {
  public status: number
  public override message: string

  constructor(status: number, message: string) {
    super(message)

    this.status = status
    this.message = message
  }
}
