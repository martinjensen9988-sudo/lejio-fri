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

# Step 1: Ensure we're in the right directory
cd /opt/render/project 2>/dev/null || cd "$(dirname "$0")" 2>/dev/null || true

PROJ_DIR="$(pwd)"
echo "📁 Project directory: $PROJ_DIR"

# Debug: List what's actually here
echo "📂 Top-level files in $PROJ_DIR:"
ls -la "$PROJ_DIR" | head -25
echo ""

# Check if package.json exists
if [ ! -f "$PROJ_DIR/package.json" ]; then
  echo "❌ package.json not found - checking git status..."
  git status 2>/dev/null || echo "Not in git repo"
  git log --oneline -3 2>/dev/null || echo "Cannot get git log"
  exit 1
fi

echo "✅ package.json found"
echo "📦 Node: $(node --version)"
echo "🔧 NPM: $(npm --version)"

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

# Start server
echo "🚀 Starting application server on port ${PORT:-3000}..."
exec node api/server.js
