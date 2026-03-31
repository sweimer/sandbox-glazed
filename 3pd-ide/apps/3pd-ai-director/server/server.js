import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRouter from './routes/chat.js';
import requestsRouter from './routes/requests.js';

dotenv.config();

const app      = express();
const PORT     = process.env.PORT     || 4001;
const HOST     = process.env.HOST     || '127.0.0.1';
const APP_SLUG = process.env.APP_SLUG || '3pd-ai-director';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5174';

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('⚠  ANTHROPIC_API_KEY is not set — /chat will fail.');
}

app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

app.use(`/api/${APP_SLUG}`, chatRouter);
app.use(`/api/${APP_SLUG}`, requestsRouter);

app.listen(PORT, HOST, () => {
  console.log(`API server running at http://${HOST}:${PORT}`);
  console.log(`  POST http://${HOST}:${PORT}/api/${APP_SLUG}/chat`);
  console.log(`  GET  http://${HOST}:${PORT}/api/${APP_SLUG}/requests`);
  console.log(`  POST http://${HOST}:${PORT}/api/${APP_SLUG}/requests`);
});
