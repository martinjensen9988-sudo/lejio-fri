#!/bin/bash

# Render start script - build React app before starting server
set -e

# Change to project root - try multiple paths
if [ -d "/opt/render/project/src" ] && [ -f "/opt/render/project/src/package.json" ]; then
  cd /opt/render/project/src
  echo "📁 Found app in /opt/render/project/src"
elif [ -d "/opt/render/project" ] && [ -f "/opt/render/project/package.json" ]; then
  cd /opt/render/project
  echo "📁 Found app in /opt/render/project"
elif [ -d "src" ] && [ -f "src/package.json" ]; then
  cd src
  echo "📁 Found app in ./src"
else
  # Fallback to local directory
  cd "$(dirname "$0")" 2>/dev/null || true
  echo "📁 Using directory: $(pwd)"
fi

PROJ_DIR="$(pwd)"
echo "🗂️  Project directory: $PROJ_DIR"
echo "📦 Node: $(node --version)"
echo "🔧 NPM: $(npm --version)"

# Debug: Check if package.json exists
if [ ! -f "package.json" ]; then
  echo "❌ ERROR: package.json not found in $PROJ_DIR"
  echo "📂 Contents of current directory:"
  ls -la | head -25
  exit 1
fi

echo "✅ package.json found"

# Script to run from the src directory, so find the root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Find the root - go up from src if needed
if [ -d "$SCRIPT_DIR/api" ]; then
  ROOT_DIR="$SCRIPT_DIR"
elif [ -d "$SCRIPT_DIR/../api" ]; then
  ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
else
  ROOT_DIR="$SCRIPT_DIR"
fi

echo "🔍 Script location: $SCRIPT_DIR"
echo "📍 Project root: $ROOT_DIR"

# Ensure dependencies are installed
echo "📥 Checking/installing dependencies..."
npm install --legacy-peer-deps --include=dev || npm install || { echo "❌ Failed to install dependencies"; exit 1; }

# Check if dist/index.html exists - if not, build it
if [ ! -f "dist/index.html" ]; then
  echo "⚠️  dist/index.html not found, building React app..."
  npm run build || { echo "❌ Build failed"; exit 1; }
  echo "✅ Build complete"
  
  if [ ! -f "dist/index.html" ]; then
    echo "❌ Build succeeded but dist/index.html still missing!"
    echo "📁 dist/ contents:"
    ls -la dist/ 2>/dev/null || echo "dist/ directory not found"
    exit 1
  fi
fi

echo "✅ dist/index.html ready"

# Start server from the root directory with correct path to api/server.js
echo "🚀 Starting application server on port ${PORT:-3000}..."
cd "$ROOT_DIR"
exec node api/server.js
