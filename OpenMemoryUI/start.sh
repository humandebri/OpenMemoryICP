#!/bin/bash

# OpenMemory UI Development Start Script

echo "🧠 Starting OpenMemory UI Development Server..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating environment file..."
    cp .env.example .env
    echo "✅ Environment file created. Please update .env with your canister ID if needed."
    echo ""
fi

echo "🚀 Starting development server..."
echo "📍 The application will be available at: http://localhost:3000"
echo ""
echo "Make sure your OpenMemory ICP canister is running locally:"
echo "   cd ../backend && dfx start"
echo "   dfx deploy openmemory"
echo ""

npm run dev