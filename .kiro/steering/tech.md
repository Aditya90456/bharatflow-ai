# Technology Stack & Build System

## Frontend Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5.4+ with hot reload
- **Styling**: Tailwind CSS 3.4+ with custom animations
- **Icons**: Heroicons React
- **Charts**: Recharts for data visualization
- **State Management**: React hooks (useState, useEffect, useCallback, useMemo)

## Backend Stack

- **Runtime**: Node.js with Express 4.19+
- **AI Integration**: Google Gemini AI (@google/genai)
- **Middleware**: CORS, body-parser, dotenv
- **API Architecture**: RESTful endpoints with JSON responses

## Development Environment

- **Package Manager**: npm
- **TypeScript**: 5.6+ with strict mode
- **Dev Server**: Vite dev server with proxy to backend
- **Environment**: Requires `GEMINI_API_KEY` in `.env.local`

## Common Commands

```bash
# Development
npm install          # Install dependencies
npm run dev         # Start frontend dev server (port 3000)
npm run start:backend # Start backend server (port 3001)

# Production
npm run build       # Build for production (outputs to dist/)
npm run preview     # Preview production build
npm start          # Serve production build

# Type Checking
tsc                # TypeScript compilation check
```

## Architecture Patterns

- **Component Structure**: Functional components with TypeScript interfaces
- **State Management**: Lift state up pattern, prop drilling for shared state
- **API Layer**: Centralized service layer (`services/geminiService.ts`)
- **Type Safety**: Comprehensive TypeScript interfaces in `types.ts`
- **Constants**: Centralized configuration in `constants.ts`

## Code Style Guidelines

- Use functional components with hooks
- Prefer `const` over `let`, avoid `var`
- Use TypeScript interfaces for all props and data structures
- Follow React naming conventions (PascalCase for components)
- Use Tailwind utility classes for styling
- Implement proper error handling in API calls