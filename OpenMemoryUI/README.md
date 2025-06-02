# OpenMemory UI

A modern React + TypeScript frontend for the OpenMemory ICP canister - an AI-powered memory assistant that helps you store, search, and discover connections between your thoughts and experiences.

## Features

- 🧠 **AI-Powered Memory Storage**: Store and organize your thoughts with intelligent categorization
- 🔍 **Semantic Search**: Find memories using natural language, not just keyword matching
- 🔗 **Memory Clustering**: Discover connections between related memories
- 🏷️ **Smart Categorization**: Automatic and manual memory categorization
- 🌐 **Internet Computer Integration**: Decentralized storage on the IC blockchain
- 🎨 **Modern UI/UX**: Beautiful, responsive interface built with Tailwind CSS
- ⚡ **Fast & Reactive**: Built with React 18 + TypeScript + Vite

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **State Management**: Zustand
- **Blockchain**: Internet Computer (Dfinity)
- **UI Components**: Custom components with Lucide React icons
- **Build Tool**: Vite

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- The OpenMemory ICP canister running (see backend setup)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   ```
   
   Update the environment variables:
   ```env
   VITE_OPENMEMORY_CANISTER_ID=your-canister-id
   VITE_DFX_NETWORK=local  # or 'ic' for production
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── layout/         # Layout components (Header, Sidebar, etc.)
│   ├── ui/             # Reusable UI components
│   ├── memory/         # Memory-specific components
│   ├── search/         # Search-related components
│   ├── clusters/       # Clustering components
│   └── categories/     # Category components
├── pages/              # Page components
├── services/           # API and IC agent services
├── stores/             # Zustand state management
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── hooks/              # Custom React hooks
```

## Key Components

### Services

- **`ic-agent.ts`**: Internet Computer agent configuration and HTTP API client
- **`openmemory-api.ts`**: High-level API service for OpenMemory operations

### State Management

- **`useMemoryStore.ts`**: Zustand store for memory, search, and UI state management

### Pages

- **HomePage**: Dashboard with memory overview and quick add functionality
- **SearchPage**: Advanced search with filters and results
- **ClustersPage**: View and explore memory clusters
- **CategoriesPage**: Manage and browse memory categories
- **SettingsPage**: User preferences and data management

## API Integration

The frontend connects to the OpenMemory ICP canister via HTTP endpoints:

- `GET /health` - Health check and system status
- `GET /memories` - Retrieve memories with pagination
- `POST /memories` - Add new memory
- `POST /search` - Search memories with semantic matching
- `POST /suggestions` - Get memory suggestions based on context
- `GET /clusters` - Get memory clusters
- `GET /categories` - Get available categories
- `POST /categories/suggest` - Get category suggestions for content

## Environment Variables

- `VITE_OPENMEMORY_CANISTER_ID`: The canister ID of your OpenMemory backend
- `VITE_DFX_NETWORK`: Network environment ('local' or 'ic')
- `VITE_DEV_MODE`: Enable development features
- `VITE_API_BASE_URL`: Base URL for API calls (development only)

## Development

### Running Tests

```bash
npm run test
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run type-check
```

## Deployment

### Local Development

1. Ensure the OpenMemory canister is running locally
2. Set `VITE_DFX_NETWORK=local` in your `.env`
3. Run `npm run dev`

### Production Deployment

1. Deploy your OpenMemory canister to the IC mainnet
2. Update `VITE_OPENMEMORY_CANISTER_ID` with your production canister ID
3. Set `VITE_DFX_NETWORK=ic`
4. Build and deploy: `npm run build`

## Features Overview

### Memory Management
- Add, view, and organize memories
- Automatic timestamp and metadata handling
- Rich text support for memory content

### Intelligent Search
- Semantic search using AI embeddings
- Filter by category, date, and tags
- Relevance scoring and explanations

### Memory Clustering
- Automatic grouping of related memories
- Visual cluster exploration
- Theme and description generation

### Category System
- Manual and automatic categorization
- Category suggestions based on content
- Category-based filtering and organization

### User Experience
- Responsive design for all devices
- Real-time search suggestions
- Toast notifications for user feedback
- Loading states and error handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of the OpenMemory ICP project. See the main repository for license information.