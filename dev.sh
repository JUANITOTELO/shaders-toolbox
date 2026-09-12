#!/usr/bin/env bash
set -e

echo "Starting Graphics & Shader Math Toolbox development environment..."

# Start PHP Backend Server on port 8000
echo "Starting PHP backend server on http://localhost:8000..."
php -S localhost:8000 -t backend/ > php_server.log 2>&1 &
PHP_PID=$!

# Trap to kill PHP server on exit
trap "kill $PHP_PID 2>/dev/null" EXIT

# Start Vite Frontend Dev Server on port 5173
echo "Starting Vite frontend server on http://localhost:5173..."
npm run dev -- --host
