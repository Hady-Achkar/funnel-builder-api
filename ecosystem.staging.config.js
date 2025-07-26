module.exports = {
  apps: [{
    name: 'funnel-builder-staging',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    cwd: '/opt/funnel-builder-staging',
    interpreter: '/usr/bin/node',
    node_args: '--max-old-space-size=1024',
    
    // Environment variables
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 5000,
      DATABASE_URL: 'postgresql://staging_user:staging_password_change_me@localhost:5433/funnel_builder_staging',
      REDIS_URL: 'redis://localhost:6380',
      JWT_SECRET: 'staging-jwt-secret-change-this-in-production',
      API_DOMAIN: 'new-api-dev.digitalsite.com',
      API_URL: 'https://new-api-dev.digitalsite.com'
    },
    
    // Logging
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    merge_logs: true,
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Process management
    autorestart: true,
    watch: false,
    max_restarts: 5,
    min_uptime: '5s',
    listen_timeout: 3000,
    kill_timeout: 5000,
    wait_ready: false,
    max_memory_restart: '1G',
    
    // Error handling
    error_backoff_restart_delay: 5000,
    
    // Post-start actions
    post_start: [
      'echo "Application started successfully"',
      'curl -s http://localhost:5000/health || echo "Health check failed"'
    ]
  }]
};