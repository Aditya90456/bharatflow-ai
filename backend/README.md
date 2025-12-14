# BharatFlow AI - Backend Server

This directory contains a Node.js Express server that acts as a secure backend for the BharatFlow application. It proxies requests to the Google Gemini API, protecting the API key and centralizing the AI logic.

## Features

-   **Secure API Proxy**: All calls to the Gemini API are routed through this server, preventing the API key from being exposed on the frontend.
-   **Centralized AI Logic**: Contains all the prompts and configurations for interacting with the Gemini models for various application features.
-   **Environment-based Configuration**: Uses a `.env` file for secure management of the API key.

## Setup & Running

1.  **Install Dependencies**: From the project root, run:
    ```bash
    npm install
    ```

2.  **Create Environment File**: Create a file named `.env` inside the `backend/` directory.

3.  **Add API Key**: In the `backend/.env` file, add your Google Gemini API key:
    ```
    API_KEY=your_gemini_api_key_here
    ```

4.  **Start the Server**: From the project root, run the following command:
    ```bash
    npm run start:backend
    ```

The server will start on `http://localhost:3001`. The frontend application (when run with `npm run dev`) is configured to proxy API requests to this server.

## Endpoints

All endpoints are prefixed with `/api`.

### 1. Analyze Traffic

-   **URL**: `/api/analyze-traffic`
-   **Method**: `POST`
-   **Description**: Analyzes a traffic snapshot and returns AI-powered suggestions for signal timing.
-   **Body**:
    ```json
    {
      "congestedIntersections": [
        { "id": "INT-0-0", "label": "Silk Board", "nsQueue": 25, "ewQueue": 10 }
      ],
      "stats": { "congestionLevel": 75, "avgSpeed": 1.5 }
    }
    ```

### 2. Analyze Junction

-   **URL**: `/api/analyze-junction`
-   **Method**: `POST`
-   **Description**: Provides a tactical analysis for a single junction based on queue lengths.
-   **Body**:
    ```json
    {
      "junctionInfo": { "id": "INT-0-0", "label": "Silk Board", "nsQueue": 25, "ewQueue": 10 }
    }
    ```

### 3. Analyze Incident

-   **URL**: `/api/analyze-incident`
-   **Method**: `POST`
-   **Description**: Assesses a reported incident and recommends an action.
-   **Body**:
    ```json
    {
      "incident": { "type": "BREAKDOWN", "severity": "HIGH", "description": "..." },
      "nearbyUnits": 2
    }
    ```
    
### 4. Explain AI Suggestion

-   **URL**: `/api/explain-suggestion`
-   **Method**: `POST`
-   **Description**: Provides a natural language explanation for a previously generated AI suggestion.
-   **Body**:
    ```json
    {
      "analysisInput": [ ... ],
      "suggestion": { "intersectionId": "INT-0-0", ... },
      "stats": { ... }
    }
    ```

### 5. Real-World Intel

-   **URL**: `/api/real-world-intel`
-   **Method**: `POST`
-   **Description**: Uses Google Search grounding to answer questions about real-world events affecting traffic.
-   **Body**:
    ```json
    {
      "query": "Is there a cricket match in Bangalore today?",
      "city": "Bangalore",
      "intersectionLabels": ["Silk Board", ...],
      "location": { "latitude": 12.97, "longitude": 77.59 }
    }
    ```

### 6. Interpret Search Query

-   **URL**: `/api/interpret-search`
-   **Method**: `POST`
-   **Description**: Uses function calling to convert a natural language search query into a structured action.
-   **Body**:
    ```json
    {
      "query": "find all police cars",
      "intersections": [ ... ],
      "cars": [ ... ],
      "incidents": [ ... ]
    }
    ```
