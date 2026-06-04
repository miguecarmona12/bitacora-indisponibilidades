#!/bin/sh
set -e

# Create runtime env-config.js used by the SPA. It will be served from the dist root.
: "${VITE_API_URL:=http://backend:8000}"
cat > /app/dist/env-config.js <<EOF
window.__APP_CONFIG__ = {
  VITE_API_URL: "${VITE_API_URL}"
};
EOF

# exec the original preview command
exec npm run preview -- --host 0.0.0.0 --port 5173
