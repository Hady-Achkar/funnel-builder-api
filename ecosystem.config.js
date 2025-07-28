module.exports = {
  apps: [
    {
      name: "funnel-builder-staging",
      script: "./dist/index.js",
      instances: 1,
      exec_mode: "fork", // Changed from cluster to fork for better error visibility
      cwd: "/opt/funnel-builder-staging",
      node_args: "--max-old-space-size=1024",
      env: {
        NODE_ENV: "development",
        PORT: 5000,
      },
      env_staging: {
        NODE_ENV: "staging",
        PORT: 5000,
        DATABASE_URL:
          "postgresql://staging_user:staging_password_change_me@localhost:5433/funnel_builder_staging",
        REDIS_URL: "redis://localhost:6380",
        JWT_SECRET: "staging-jwt-secret-change-this-in-production",
        // Add Cloudflare env vars
        CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || "",
        CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID || "",
        CLOUDFLARE_ZONE_ID: process.env.CLOUDFLARE_ZONE_ID || "",
        CLOUDFLARE_SAAS_TARGET: process.env.CLOUDFLARE_SAAS_TARGET || "",
        PLATFORM_MAIN_DOMAIN:
          process.env.PLATFORM_MAIN_DOMAIN || "digitalsite.ai",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      merge_logs: true,
      time: true,
      wait_ready: false, // Changed to false to avoid timeout issues
      listen_timeout: 3000,
      max_memory_restart: "1G",
      watch: false,
      ignore_watch: ["node_modules", "logs", ".git"],
      autorestart: true,
      max_restarts: 5, // Reduced from 10
      min_uptime: "5s", // Reduced from 10s
      kill_timeout: 5000,
    },
  ],
};
