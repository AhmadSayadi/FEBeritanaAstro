/**
 * PM2 config for the Astro (Node standalone) server on the VPS.
 *
 * Run from the project root on the VPS:
 *   pm2 start ecosystem.config.cjs
 *   pm2 save                 # persist across reboots (after `pm2 startup`)
 *   pm2 logs beritana-astro  # tail logs
 *   pm2 restart beritana-astro
 *
 * Notes for the 1GB-RAM box:
 *  - fork mode, single instance (cluster would multiply RAM; 1GB can't afford it).
 *  - max_memory_restart caps the process; PM2 restarts it if it bloats.
 *  - --max-old-space-size limits V8's heap so Node stays well under 1GB.
 *  - HOST=127.0.0.1 so the app is only reachable via the reverse proxy
 *    (Nginx/Caddy), never directly from the internet. PORT=20166 (from the
 *    allowed range 20161-20170).
 */
module.exports = {
  apps: [
    {
      name: 'beritana-astro',
      script: './dist/server/entry.mjs',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      // Cap V8 heap (MB). Leaves headroom for the OS + Nginx on a 1GB box.
      node_args: '--max-old-space-size=512',
      // If the process grows past this, PM2 restarts it (safety net against OOM).
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '20166',
      },
      // Restart policy
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 2000,
      // Log files (relative to cwd). `pm2 flush` clears them.
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      merge_logs: true,
      time: true,
    },
  ],
}
