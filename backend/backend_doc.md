# Backend Developer Documentation - Aetheris OS

This document outlines the architectural specifications, API endpoints, folder layouts, and database integrations for the Aetheris OS backend server.

---

## 📂 Project Structure (`d:\robovanthehackbackend`)

```
robovanthehackbackend/
├── config/
│   ├── db.js               # MongoDB client configuration
│   └── vectorDb.js         # ChromaDB / Pinecone vector integration
├── controllers/
│   ├── authController.js   # Custom verification logs and onboarding
│   ├── boardroomCtrl.js    # Coordinating multi-agent discussions
│   └── telemetryCtrl.js    # Telemetry data stream feeds
├── models/
│   ├── User.js             # User data schema
│   ├── BusinessProfile.js  # Business DNA records (RAG metadata)
│   └── Campaign.js         # Generated campaigns and execution templates
├── routes/
│   ├── api.js              # REST endpoints definition
│   └── socket.js           # WebSocket events coordinator
├── services/
│   └── aiGateway.js        # Gemini API orchestration service
├── server.js               # Main entry gateway (Express + Socket.io listener)
├── package.json
└── README.md
```

---

## ⚡ API Endpoint Specification

### Authentication & Ingress
* `POST /api/auth/register`: Create user and store credentials.
* `POST /api/auth/login`: Authenticate clinician/CEO and return JWT session tokens.
* `POST /api/business/onboard`: Ingests company context (name, size, files) and triggers the RAG indexing pipeline.

### Strategy & Metrics
* `GET /api/business/dashboard-stats`: Retrieves the 9 required metrics (Health Score, Growth Score, Risk Alerts, etc.).
* `POST /api/business/stress-test`: Run a Monte Carlo simulation based on client-input levers.
* `GET /api/business/campaigns`: Fetch generated copy assets and pipelines.

---

## 🔌 WebSocket Telemetry Streams
A live connection is maintained via `Socket.io` to feed data streams to the React dashboard without polling:
* **Event `boardroom_debate_trigger`**: Fired by the client. Backend spins up the multi-agent boardroom simulation thread and streams debate texts, voting metrics, and sentiment data back as they generate.
* **Event `telemetry_stream_start`**: Backend streams random but mathematically realistic business health ticks (sales, traffic, heart rates) every 1 second.
* **Event `crisis_alert`**: Fired by the backend to warn the frontend when simulated performance falls below 80%.

---

## 🗄️ Database Schemas & Caching
* **MongoDB Schema (`BusinessProfile`)**: Holds key metrics like revenue, target audience, and extracted business tokens.
* **Vector Database Ingestion (Chroma/Pinecone)**: Used to segment and index business PDFs (pitch decks, invoices) to allow local RAG queries during agent boardroom debates.
