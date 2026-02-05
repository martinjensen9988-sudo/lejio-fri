#!/bin/bash

# Render start script - build React app before starting server
set -e

# Change to project root
cd /opt/render/project 2>/dev/null || cd "$(dirname "$0")" 2>/dev/null || true

PROJ_DIR="$(pwd)"
echo "📁 Project directory: $PROJ_DIR"
echo "📦 Node: $(node --version)"
echo "🔧 NPM: $(npm --version)"

# Debug: List what's in the project directory
echo "📂 Contents of $PROJ_DIR:"
ls -la "$PROJ_DIR" | head -20
echo ""

# Debug: Check if package.json exists
if [ -f "$PROJ_DIR/package.json" ]; then
  echo "✅ Found package.json"
else
  echo "❌ ERROR: package.json not found in $PROJ_DIR"
  echo "Attempting to list all .json files:"
  find "$PROJ_DIR" -maxdepth 2 -name "*.json" -type f 2>/dev/null | head -20
  exit 1
fi

# Step 1: Ensure dependencies are installed
echo "📥 Checking dependencies..."
if [ ! -d "node_modules" ]; then
  echo "⚠️  Installing npm dependencies..."
  npm install --legacy-peer-deps || npm install || { echo "❌ Failed to install dependencies"; exit 1; }
else
  echo "✅ node_modules exists"
fi

# Step 2: Check for vite (needed to build)
if [ ! -d "node_modules/vite" ]; then
  echo "⚠️  Vite not available, reinstalling devDependencies..."
  npm install --save-dev vite || npm install || { echo "❌ Failed to install vite"; exit 1; }
fi

# Step 3: Build React app
if [ ! -f "dist/index.html" ]; then
  echo "🏗️  Building React application..."
  rm -rf dist dist-ssr .vite-cache 2>/dev/null || true
  npm run build || { echo "❌ Build failed"; exit 1; }
  echo "✅ Build complete"
fi

# Step 4: Verify build result
if [ ! -f "dist/index.html" ]; then
  echo "⚠️  Warning: dist/index.html not found after build"
  echo "📁  dist/ contents:"
  ls -la dist/ 2>/dev/null | head -20 || echo "dist/ directory is empty"
fi

# Step 5: Start server
echo "🚀 Starting application server..."
exec node api/server.js
