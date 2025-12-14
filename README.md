# BharatFlow AI

BharatFlow AI is an advanced traffic management system designed for Indian metropolitan areas. It's a real-time traffic simulation and control platform that combines AI-powered analysis with interactive visualization.

## Features

- **Real-time Traffic Simulation**: Interactive 2D grid-based traffic simulation with vehicles, intersections, and incidents
- **AI Traffic Analysis**: Gemini AI integration for traffic pattern analysis and optimization recommendations
- **Multi-city Support**: Pre-configured for major Indian cities (Bangalore, Mumbai, Delhi, Chennai, etc.)
- **Incident Management**: Real-time incident tracking and response coordination
- **Live Intelligence**: Real-world traffic data integration via web search
- **Interactive Dashboard**: Command center interface with multiple view modes (grid/satellite)

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Google Gemini AI
- **Styling**: Tailwind CSS with custom animations
- **Icons**: Heroicons React
- **Charts**: Recharts for data visualization

## Quick Start

### Option 1: Using Batch Files (Windows)
1. **Verify Setup**: Double-click `verify-setup.bat` to check your installation
2. **Install Dependencies**: Double-click `install-deps.bat`
3. **Set up Environment**: Ensure `.env.local` has your `GEMINI_API_KEY`
4. **Start Development**: Double-click `start-dev.bat`

### Option 2: Manual Setup
1. **Install Dependencies**
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

2. **Environment Setup**
   - Ensure `.env.local` contains: `GEMINI_API_KEY=your_api_key_here`

3. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   npm run start:backend
   
   # Terminal 2 - Frontend
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Troubleshooting

### PowerShell Execution Policy Error
If you get "execution of scripts is disabled" error:
1. Use the provided `.bat` files instead of npm commands
2. Or run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### Backend Connection Issues
- Ensure backend is running on port 3001
- Check that `GEMINI_API_KEY` is set in `.env.local`
- Verify backend dependencies are installed

### Frontend Build Issues
- Clear node_modules: `rm -rf node_modules package-lock.json`
- Reinstall: `npm install`
- Check TypeScript compilation: `npx tsc --noEmit`

## Project Structure

```
bharatflow-ai/
├── components/          # React components
├── services/           # API service layer
├── backend/           # Express server
├── src/               # CSS and assets
├── types.ts          # TypeScript interfaces
├── constants.ts      # Configuration constants
├── tailwind.config.js # Tailwind configuration
├── install-deps.bat  # Windows dependency installer
├── start-dev.bat     # Windows development starter
└── README.md
```

## Development Commands

- `npm run dev` - Start frontend development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run start:backend` - Start backend server
- `npx tsc` - TypeScript type checking

## Environment Variables

Required in `.env.local`:
```
GEMINI_API_KEY=your_google_gemini_api_key_here
```

## License

MIT License
