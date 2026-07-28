// PM2 process definitions for the Church app (no Docker).
//
// Only the API runs under PM2. The client is a static Next.js export
// (next.config.js: output: 'export') — nginx serves client/out/ directly off
// disk, no Node process or port needed for it (see the nginx reference config
// this pipeline points at). `deploy.sh` still builds client/out/ on every
// deploy; PM2 just has nothing to do with it.
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
  ],
};
