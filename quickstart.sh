#!/bin/bash

# IBD Navigator Quick Start Script

echo "🚀 IBD Navigator Railway - Quick Start"
echo "====================================="
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Build domain context
echo ""
echo "🔨 Building domain context..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build domain context"
    exit 1
fi

# Start server
echo ""
echo "✅ Setup complete! Starting server..."
echo ""
npm start
