#!/bin/bash

# Render start script - ensures build happens before server starts
set -e

# Change to project root
cd /opt/render/project

echo "🔍 Checking if dist/ exists..."
if [ ! -d "dist" ]; then
  echo "❌ dist/ not found - running build..."
  echo "📁 Current directory: $(pwd)"
  npm run build
  echo "✅ Build complete"
  echo "📁 dist/ now exists: $(ls -la dist | head -3)"
else
  echo "✅ dist/ found at $(pwd)/dist"
  echo "📁 Contents: $(ls -la dist | head -5)"
fi

echo "🚀 Starting server from $(pwd)..."
node api/server.js
