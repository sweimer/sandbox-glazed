import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './db/database.js';
import testRoutes from './routes/testRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());          // <-- FIXED
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/test', testRoutes);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  await testConnection();
});
