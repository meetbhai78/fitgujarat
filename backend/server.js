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

// Serve APK download directly with correct content headers
app.get('/app.apk', (req, res) => {
  const apkPath = path.join(__dirname, '..', 'frontend', 'app.apk');
  res.download(apkPath, 'GujaratStepCounter.apk', (err) => {
    if (err) {
      console.error('Error serving app.apk:', err);
      if (!res.headersSent) {
        res.status(404).send('APK file not found. Please compile the app first.');
      }
    }
  });
});

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

    // Run migration: Generate referral codes for any existing users
    try {
      const User = require('./models/User');
      const usersWithoutRef = await User.find({
        $or: [
          { referral_code: { $exists: false } },
          { referral_code: null },
          { referral_code: '' }
        ]
      });
      if (usersWithoutRef.length > 0) {
        console.log(`⚡ [Migration] Found ${usersWithoutRef.length} users without referral codes. Generating...`);
        for (const u of usersWithoutRef) {
          const cleanName = u.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 5);
          const randomNum = Math.floor(1000 + Math.random() * 9000);
          u.referral_code = `${cleanName || 'user'}${randomNum}`;
          await u.save();
        }
        console.log(`✅ [Migration] Referral codes generated for ${usersWithoutRef.length} users.`);
      }
    } catch (migError) {
      console.error('❌ [Migration] Referral code migration failed:', migError);
    }

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
