#!/bin/bash

# Render start script - ensures build happens before server starts
set -e

echo "🔍 Checking if dist/ exists..."
if [ ! -d "dist" ]; then
  echo "❌ dist/ not found - running build..."
  npm run build
  echo "✅ Build complete"
else
  echo "✅ dist/ found"
fi

echo "🚀 Starting server..."
node api/server.js
