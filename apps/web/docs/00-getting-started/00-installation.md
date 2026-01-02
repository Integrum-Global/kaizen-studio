# Installation

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm 10+ or pnpm 9+
- Git

## Quick Start

```bash
# Navigate to frontend directory
cd apps/kaizen-studio/apps/web

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`.

## Environment Configuration

Create a `.env` file in the frontend directory:

```bash
# API Configuration
VITE_API_URL=http://localhost:8000/api/v1

# Optional: Enable debug mode
VITE_DEBUG=false
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run type-check` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests with Vitest |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:e2e` | Run Playwright E2E tests |

## IDE Setup

### VS Code (Recommended)

Install the recommended extensions when prompted, or manually install:

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)

Workspace settings are pre-configured in `.vscode/settings.json`.

### Path Aliases

The project uses `@/` as an alias for `src/`. Configure your IDE to recognize this:

```json
// tsconfig.json excerpt
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Module Resolution Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors After Updates

```bash
# Restart TypeScript server in VS Code
Cmd+Shift+P -> "TypeScript: Restart TS Server"
```
