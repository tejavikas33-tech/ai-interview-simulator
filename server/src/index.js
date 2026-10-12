import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import interviewRoutes from './routes/interviews.js';
import { isGeminiConfigured } from './gemini.js';
import { isSupabaseConfigured, testSupabaseConnection } from './supabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Health and Diagnostics endpoint
app.get('/api/health', async (req, res) => {
  const supabaseStatus = await testSupabaseConnection();
  return res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    services: {
      geminiAi: {
        configured: isGeminiConfigured,
        model: 'gemini-2.5-flash',
        status: isGeminiConfigured ? 'Ready (Gemini API Active)' : 'Demo Mode (Intelligent Curated Engine)'
      },
      supabasePostgreSQL: {
        configured: isSupabaseConfigured,
        connected: supabaseStatus.connected,
        message: supabaseStatus.message
      }
    }
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/interviews', interviewRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 PrepPulse AI Server running on http://localhost:${PORT}`);
  console.log(`🤖 Gemini AI Status: ${isGeminiConfigured ? 'ACTIVE (@google/genai)' : 'FALLBACK ENGINE (Add GEMINI_API_KEY to activate)'}`);
  console.log(`🗄️ Supabase Status: ${isSupabaseConfigured ? 'CONFIGURED' : 'LOCAL PERSISTENT STORE (Add SUPABASE_URL to activate)'}`);
  console.log(`=======================================================`);
});
