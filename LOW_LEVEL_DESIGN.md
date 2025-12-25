# BharatFlow AI - Low Level Design (LLD)

## 1. System Overview

BharatFlow AI is a comprehensive traffic management and simulation system designed for Indian metropolitan areas. The system provides real-time traffic monitoring, AI-powered optimization, and intelligent simulation capabilities.

### 1.1 Architecture Pattern
- **Frontend**: React + TypeScript (SPA)
- **Backend**: Node.js + Express (RESTful API)
- **Database**: SQLite (Local) + Optional MongoDB
- **AI Integration**: Google Gemini AI
- **Real-time Communication**: Server-Sent Events (SSE)
- **Deployment**: Containerized (Docker) + Cloud Ready

## 2. Frontend Architecture

### 2.1 Component Hierarchy
```
App.tsx (Root)
├── LandingPage.tsx
├── TrafficDashboard.tsx
│   ├── SimulationSection.tsx
│   │   ├── RealTimeCanvas.tsx
│   │   └── SimulationDesigner.tsx
│   ├── LiveTrafficMap.tsx
│   ├── UserLocationModal.tsx
│   └── SidePanels/
│       ├── OverviewPanel.tsx
│       ├── IntersectionDetails.tsx
│       ├── VehicleDetails.tsx
│       └── IncidentDetails.tsx
├── UI Components/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   └── StatusIndicator.tsx
└── Enhanced Components/
    ├── AiSearchBar.tsx
    ├── NotificationSystem.tsx
    └── EnhancedStatsCard.tsx
```

### 2.2 State Management
```typescript
// Global Application State
interface AppState {
  viewState: ViewState;
  currentCity: string;
  intersections: Intersection[];
  roads: Road[];
  cars: Car[];
  incidents: Incident[];
  stats: TrafficStats;
  
  // UI State
  activeTab: ActiveTab;
  selectedIntersectionId: string | null;
  selectedCarId: string | null;
  
  // AI State
  geminiAnalysis: GeminiAnalysis | null;
  realWorldIntel: RealWorldIntel | null;
  isAnalyzing: boolean;
}
```