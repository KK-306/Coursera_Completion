
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import registrationRoutes from './routes/registrations.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';

const app = express();

const PORT = Number(process.env.PORT || 5000);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const MONGODB_URI = process.env.MONGODB_URI;

// Configure CORS for the frontend
const allowedOrigins = [
  CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Parse JSON request bodies
app.use(express.json({ limit: '100kb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'CoursePilot API',
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1
        ? 'connected'
        : 'disconnected',
  });
});

// Application routes
app.use('/api/registrations', registrationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found.',
  });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled server error:', err);

  res.status(500).json({
    success: false,
    message: 'Unexpected server error.',
  });
});

// Connect to MongoDB before starting the server
async function startServer() {
  try {
    if (!MONGODB_URI) {
      throw new Error(
        'MONGODB_URI is missing. Add it to your server/.env file.'
      );
    }

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log('MongoDB connected successfully.');

    app.listen(PORT, () => {
      console.log(`CoursePilot API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
}

startServer();
