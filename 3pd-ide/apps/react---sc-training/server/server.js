import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import submissionsRouter from './routes/submissions.js';

dotenv.config();

const app      = express();
const PORT     = process.env.PORT     || 4000;
const HOST     = process.env.HOST     || '127.0.0.1';
const APP_SLUG = process.env.APP_SLUG || 'react---app';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

app.use(`/api/${APP_SLUG}`, submissionsRouter);

app.listen(PORT, HOST, () => {
  console.log(`API server running at http://${HOST}:${PORT}`);
  console.log(`  GET  http://${HOST}:${PORT}/api/${APP_SLUG}/submissions`);
  console.log(`  POST http://${HOST}:${PORT}/api/${APP_SLUG}/submissions`);
});
