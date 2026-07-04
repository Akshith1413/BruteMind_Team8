import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import apiRouter from './routes/api.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Enable CORS for frontend accessibility (standard port is 5173 for Vite dev server)
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

// API Routes
app.use('/api', apiRouter);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Aetheris Server Online', timestamp: new Date() });
});

// Socket Connections Handler
io.on('connection', (socket) => {
  console.log(`New client telemetry handshake established: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Client telemetry connection terminated: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas first, then start listening
async function startServer() {
  try {
    await connectDB();
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
