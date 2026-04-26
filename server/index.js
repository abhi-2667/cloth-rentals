const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const devStore = require('./utils/devStore');
const { seedMongoDemoDataIfEmpty } = require('./utils/bootstrapMongo');

dotenv.config();

const app = express();

const isProduction = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
const normalizeOrigin = (value) => String(value || '').trim().replace(/\/$/, '');

const configuredCorsOrigins = String(process.env.CORS_ORIGINS || '')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

const clientOrigin = normalizeOrigin(process.env.CLIENT_URL);
if (clientOrigin && !configuredCorsOrigins.includes(clientOrigin)) {
  configuredCorsOrigins.push(clientOrigin);
}

const isLocalDevOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const normalized = normalizeOrigin(origin);
    if (!isProduction && isLocalDevOrigin(normalized)) {
      return callback(null, true);
    }

    if (configuredCorsOrigins.includes(normalized)) {
      return callback(null, true);
    }

    return callback(new Error('CORS origin not allowed'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, please try again later.' },
});

// Middleware
if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use('/api', globalLimiter);

// Main Entry Point
const PORT = process.env.PORT || 5000;
const useDevStore = !process.env.MONGO_URI;
const uploadsDir = path.resolve(__dirname, 'uploads');

// Routes
const authRoutes = require('./routes/auth');
const clothRoutes = require('./routes/clothes');
const bookingRoutes = require('./routes/bookings');
const userRoutes = require('./routes/users');
const wishlistRoutes = require('./routes/wishlist');
const reviewRoutes = require('./routes/reviews');

app.use('/api/auth', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/clothes', clothRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/ready', (req, res) => {
  const dbReady = useDevStore ? true : mongoose.connection.readyState === 1;
  if (!dbReady) {
    return res.status(503).json({ status: 'not_ready' });
  }
  return res.status(200).json({ status: 'ready' });
});

app.use((err, req, res, next) => {
  if (err && err.message === 'CORS origin not allowed') {
    return res.status(403).json({ message: 'CORS origin not allowed' });
  }

  return next(err);
});

app.use((err, req, res, next) => {
  const statusCode = err?.statusCode || 500;
  const message = statusCode >= 500 ? 'Internal server error' : err.message;
  return res.status(statusCode).json({ message });
});

// Basic Route
app.get('/', (req, res) => {
  res.send('Cloth Rental API Server is running...');
});

// Create upload directory if it doesn't exist for local testing fallback
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Map uploads folder for local storage serving
app.use('/uploads', express.static(uploadsDir));

let httpServer = null;

const shutdown = async (signal) => {
  console.log(`Received ${signal}. Shutting down server...`);

  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
  }

  if (!useDevStore && mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  process.exit(0);
};

const startServer = async () => {
  try {
    if (useDevStore) {
      await devStore.seedInventory();
      console.warn('MONGO_URI is not set. Using the built-in development data store.');
    } else {
      await mongoose.connect(process.env.MONGO_URI);

      const seeded = await seedMongoDemoDataIfEmpty();
      if (seeded.usersInserted > 0 || seeded.clothesInserted > 0) {
        console.log(`Seeded Mongo demo data: ${seeded.usersInserted} users, ${seeded.clothesInserted} clothes`);
      }

      console.log('Connected to MongoDB');
    }

    httpServer = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

startServer();

process.on('SIGINT', () => {
  shutdown('SIGINT').catch((error) => {
    console.error('Shutdown error:', error);
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM').catch((error) => {
    console.error('Shutdown error:', error);
    process.exit(1);
  });
});
