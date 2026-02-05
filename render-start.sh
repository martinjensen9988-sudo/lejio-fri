#!/bin/bash

# Render start script - ensures dependencies and build happen before server starts
set -e

# Change to project root
cd /opt/render/project 2>/dev/null || cd "$(dirname "$0")" 2>/dev/null || true

echo "📁 Working directory: $(pwd)"
echo "✅ Node version: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# Verify node_modules exists and has dependencies
echo "🔍 Checking dependencies..."
if [ ! -d "node_modules" ] || [ ! -f "node_modules/express/package.json" ]; then
  echo "⚠️  node_modules incomplete - installing dependencies..."
  npm install || { echo "❌ npm install failed"; exit 1; }
  echo "✅ Dependencies installed"
else
  echo "✅ Dependencies already installed"
fi

# Check if dist needs to be built
echo "🔍 Checking if dist/ needs rebuilding..."
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ] || [ ! -f "dist/api" ]; then
  echo "⚠️  dist/ missing or incomplete - running build..."
  echo "🔨 Building with npm..."
  npm run build || { echo "❌ Build failed"; exit 1; }
  
  echo "✅ Build complete"
  if [ -f "dist/index.html" ]; then
    echo "✅ dist/index.html created successfully"
  else
    echo "❌ dist/index.html missing after build"
    echo "📁 Contents of dist/:"
    ls -la dist/ 2>/dev/null || echo "(dist/ directory not found)"
    exit 1
  fi
  
  if [ -d "dist/api" ]; then
    echo "✅ dist/api directory exists"
  else
    echo "⚠️  dist/api directory not found (expected if using api/server.js)"
  fi
else
  echo "✅ dist/ already built"
fi

echo "🚀 Starting server from: $(pwd)/api/server.js"
exec node api/server.js
