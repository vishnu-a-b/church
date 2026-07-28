// PM2 process definitions for the Church app (no Docker).
// Lives at the repo root because it spans both server/ and client/ —
// unlike edv, where only the backend runs under PM2.
module.exports = {
  apps: [
    {
      name: 'church-api',
      script: 'dist/server.js',
      cwd: '/home/projects/church/server',
      // Fork mode, single instance — NOT cluster like edv's backend.
      // This process registers node-cron jobs at startup (campaignDuesProcessor,
      // edvBridgeRetryProcessor, monthlySupportProcessor); running >1 instance
      // would fire each job once per instance concurrently.
      instances: 1,
      exec_mode: 'fork',
      watch: false,

      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5010,
      },

      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,

      out_file: '/var/log/pm2/church-api-out.log',
      error_file: '/var/log/pm2/church-api-err.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'church-web',
      // Static Next.js export (next.config.js: output: 'export') — served via
      // the `serve` package, not `next start` (which doesn't serve a static export).
      // Requires `npm install -g serve` on the server once (see scripts/server-setup.sh).
      script: 'serve',
      args: ['-s', 'out', '-l', '5011'],
      cwd: '/home/projects/church/client',
      instances: 1,
      exec_mode: 'fork',
      watch: false,

      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,

      out_file: '/var/log/pm2/church-web-out.log',
      error_file: '/var/log/pm2/church-web-err.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
