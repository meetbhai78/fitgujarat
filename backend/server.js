require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { initCronJobs } = require('./cron/scheduler');

// Route imports
const authRoutes = require('./routes/auth');
const activityRoutes = require('./routes/activity');
const leaderboardRoutes = require('./routes/leaderboard');
const winnersRoutes = require('./routes/winners');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');

// i18n
const { translations, DISTRICT_NAMES_GU } = require('./config/i18n');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/winners', winnersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/', aiRoutes);

// i18n endpoint
app.get('/api/i18n/:lang', (req, res) => {
  const lang = req.params.lang;
  if (!translations[lang]) {
    return res.status(400).json({ error: 'Unsupported language' });
  }
  res.json({
    translations: translations[lang],
    districtNames: lang === 'gu' ? DISTRICT_NAMES_GU : null
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
  }
});

// Start server
async function startServer() {
  try {
    await connectDB();

    // Initialize cron jobs
    initCronJobs();

    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════╗
║   🏃 Gujarat Step Counter App                ║
║   Server running on http://localhost:${PORT}     ║
║   Environment: ${process.env.NODE_ENV || 'development'}                  ║
╚═══════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
