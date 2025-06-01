#!/bin/bash

# OpenMemory Build Script
# This script builds and deploys the OpenMemory canister

set -e

echo "🚀 OpenMemory Build Script"
echo "=========================="

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ DFX is not installed. Please install the IC SDK first."
    echo "Visit: https://internetcomputer.org/docs/current/developer-docs/setup/install"
    exit 1
fi

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  Warning: OPENAI_API_KEY environment variable is not set."
    echo "   Embedding generation will not work without this."
    echo "   You can set it with: export OPENAI_API_KEY='your-key-here'"
fi

# Check dfx version
echo "📋 DFX Version:"
dfx --version

# Start dfx if not running
if ! dfx ping &> /dev/null; then
    echo "🔄 Starting local DFX replica..."
    dfx start --background --clean
else
    echo "✅ DFX replica is running"
fi

# Build the canister
echo "🔨 Building canister..."
dfx build openmemory

# Deploy the canister
echo "🚀 Deploying canister..."
dfx deploy openmemory

# Get canister info
CANISTER_ID=$(dfx canister id openmemory)
echo "✅ Deployment successful!"
echo "📍 Canister ID: $CANISTER_ID"
echo "🌐 Local URL: http://localhost:4943"
echo "🌐 IC URL: https://$CANISTER_ID.ic0.app"

# Test health endpoint
echo ""
echo "🧪 Testing health endpoint..."
if curl -s "http://localhost:4943/health" > /dev/null; then
    echo "✅ Health check passed"
    curl -s "http://localhost:4943/health" | jq .
else
    echo "❌ Health check failed"
fi

echo ""
echo "🎉 OpenMemory is ready!"
echo ""
echo "Next steps:"
echo "1. Set your OpenAI API key: export OPENAI_API_KEY='your-key'"
echo "2. Try the Python client: python3 clients/python/openmemory_client.py"
echo "3. Or use curl to test the API directly"
echo ""
echo "Example API calls:"
echo "curl http://localhost:4943/health"
echo "curl 'http://localhost:4943/memories/search?q=test&limit=5'"
echo ""
echo "For authentication, use: -H 'Authorization: Bearer test-token'"