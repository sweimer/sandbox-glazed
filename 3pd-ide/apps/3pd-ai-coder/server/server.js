import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import generateRouter from './routes/generate.js';
import historyRouter from './routes/history.js';

dotenv.config();

const app      = express();
const PORT     = process.env.PORT     || 4000;
const HOST     = process.env.HOST     || '127.0.0.1';
const APP_SLUG = process.env.APP_SLUG || '3pd-ai-coder';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('⚠  ANTHROPIC_API_KEY is not set — /generate will fail.');
}

app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

app.use(`/api/${APP_SLUG}`, generateRouter);
app.use(`/api/${APP_SLUG}`, historyRouter);

app.listen(PORT, HOST, () => {
  console.log(`API server running at http://${HOST}:${PORT}`);
  console.log(`  POST http://${HOST}:${PORT}/api/${APP_SLUG}/generate`);
  console.log(`  GET  http://${HOST}:${PORT}/api/${APP_SLUG}/history`);
  console.log(`  DEL  http://${HOST}:${PORT}/api/${APP_SLUG}/history/:id`);
});
