import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { syncMemoryIndex } from './config/vectorDb.js';
import apiRouter from './routes/api.js';
import registerSocketCoordinator from './routes/socket.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Enable CORS for frontend accessibility
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// Socket.io Server Setup
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Register WebSocket Actions (Telemetry streams, simulations, boardroom)
registerSocketCoordinator(io);

// API Routes
app.use('/api', apiRouter);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Aetheris Server Online', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas first, sync index, then start listening
async function startServer() {
  try {
    await connectDB();
    await syncMemoryIndex();
    
    httpServer.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`   AETHERIS CORE SERVER IS RUNNING ON PORT ${PORT}`);
      console.log(`   ENVIRONMENT: DEVELOPMENT`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Fatal: Server startup failed due to database connection error.', error);
    process.exit(1);
  }
}

startServer();

// Refactor: format startup console banner
