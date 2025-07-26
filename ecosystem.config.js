module.exports = {
  apps: [{
    name: process.env.NODE_ENV === 'production' ? 'funnel-builder' : 'funnel-builder-staging',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    cwd: process.env.NODE_ENV === 'production' ? '/opt/funnel-builder' : '/opt/funnel-builder-staging',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 3001,
      DATABASE_URL: 'postgresql://staging_user:staging_password_change_me@localhost:5433/funnel_builder_staging',
      REDIS_URL: 'redis://localhost:6380',
      JWT_SECRET: 'staging-jwt-secret-change-this-in-production'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    wait_ready: true,
    listen_timeout: 10000,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.git'],
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000,
    post_update: ['npm install', 'echo "App updated"']
  }]
};