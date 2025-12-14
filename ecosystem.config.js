/**
 * PM2 配置文件
 * 生产环境集群模式运行
 */

module.exports = {
  apps: [
    {
      name: 'prexis',
      script: './dist/src/server.js',
      instances: 'max', // 使用所有 CPU 核心
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',

      // 环境变量
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // 日志配置
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,

      // 性能优化
      node_args: [
        '--max-old-space-size=2048',
        '--optimize-for-size',
      ],

      // 优雅重启
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,

      // 指数退避重启
      exp_backoff_restart_delay: 100,
    },
  ],
}
