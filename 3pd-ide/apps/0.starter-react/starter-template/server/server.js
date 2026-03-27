import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import testRoutes from './routes/testRoutes.js';

dotenv.config();

const app         = express();
const PORT        = process.env.PORT        || 4000;
const HOST        = process.env.HOST        || '127.0.0.1';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

app.use('/api/test', testRoutes);

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
