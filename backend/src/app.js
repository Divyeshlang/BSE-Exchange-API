import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/apiRoutes.js';

const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');

/**
 * Configure Express Application & Middleware
 */
export function createApp() {
  const app = express();

  // Enable CORS for frontend client
  app.use(cors({ origin: CORS_ORIGINS, methods: ['*'], allowedHeaders: ['*'] }));
  
  // Parse incoming JSON payloads
  app.use(express.json());

  // Mount API endpoints
  app.use('/', apiRoutes);

  return app;
}
