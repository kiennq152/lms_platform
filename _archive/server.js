import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import routes (MVC pattern)
import authRoutes from './routes/auth.mvc.js';
import coursesRoutes from './routes/courses.mvc.js';
// Legacy routes (for backward compatibility)
// import authRoutes from './routes/auth.js';
// import coursesRoutes from './routes/courses.js';
import enrollmentsRoutes from './routes/enrollments.js';
import instructorRoutes from './routes/instructor.js';
import contentRoutes from './routes/content.js';
import usersRoutes from './routes/users.js';
import cartRoutes from './routes/cart.js';
import forumRoutes from './routes/forum.js';
import certificatesRoutes from './routes/certificates.js';
import transactionsRoutes from './routes/transactions.js';
import lessonProgressRoutes from './routes/lesson-progress.js';
import systemLogsRoutes from './routes/system-logs.js';
import settingsRoutes from './routes/settings.js';
import testRoutes from './routes/test.js';
import firebaseAuthRoutes from './routes/firebase-auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5173;

const ROOT_PATH = path.join(__dirname, '..');
const CLIENT_BUILD_PATH = path.join(ROOT_PATH, 'client');
const DOCS_PATH = path.join(ROOT_PATH, 'docs');

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (before routes)
app.use((req, res, next) => {
  // Skip logging for static assets
  if (!req.path.startsWith('/api') && !req.path.startsWith('/test') && req.path !== '/health') {
    return next();
  }
  console.log(`📥 ${req.method} ${req.path}`, {
    query: req.query,
    body: req.method === 'POST' ? { ...req.body, password: req.body.password ? '***' : undefined } : undefined,
    headers: {
      'content-type': req.headers['content-type'],
      'origin': req.headers.origin
    }
  });
  next();
});

// Health check (before routes)
app.get('/health', async (_req, res) => {
  try {
    // Test database connection
    const pool = (await import('./config/database.js')).default;
    await pool.query('SELECT 1');
    
    res.json({ 
      status: 'ok', 
      timestamp: Date.now(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      timestamp: Date.now(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// API Routes (MUST be before static files)
console.log('🔧 Registering API routes...');
try {
  app.use('/api/auth', authRoutes);
  console.log('✅ /api/auth routes registered');
} catch (error) {
  console.error('❌ Failed to register /api/auth routes:', error);
}

try {
  app.use('/api/courses', coursesRoutes);
  console.log('✅ /api/courses routes registered');
} catch (error) {
  console.error('❌ Failed to register /api/courses routes:', error);
}

try {
  app.use('/api/enrollments', enrollmentsRoutes);
  console.log('✅ /api/enrollments routes registered');
} catch (error) {
  console.error('❌ Failed to register /api/enrollments routes:', error);
}

try {
  app.use('/api/instructor', instructorRoutes);
  console.log('✅ /api/instructor routes registered');
} catch (error) {
  console.error('❌ Failed to register /api/instructor routes:', error);
}

try {
  app.use('/api/content', contentRoutes);
  console.log('✅ /api/content routes registered');
} catch (error) {
  console.error('❌ Failed to register /api/content routes:', error);
}

// Users routes (MVC pattern)
try {
  const usersMvcRoutes = (await import('./routes/users.mvc.js')).default;
  app.use('/api/users', usersMvcRoutes);
  console.log('✅ /api/users routes registered (MVC)');
} catch (error) {
  console.error('❌ Failed to register /api/users routes (MVC):', error);
  // Fallback to legacy routes
  try {
    app.use('/api/users', usersRoutes);
    console.log('✅ /api/users routes registered (legacy)');
  } catch (fallbackError) {
    console.error('❌ Failed to register legacy /api/users routes:', fallbackError);
  }
}

try {
  app.use('/api/cart', cartRoutes);
  console.log('✅ /api/cart routes registered');
} catch (error) {
  console.error('❌ Failed to register /api/cart routes:', error);
}

try {
  app.use('/api/forum', forumRoutes);
  console.log('✅ /api/forum routes registered');
} catch (error) {
  console.error('❌ Failed to register /api/forum routes:', error);
}

try {
  app.use('/api/certificates', certificatesRoutes);
  console.log('✅ /api/certificates routes registered');
} catch (error) {
  console.error('❌ Failed to register /api/certificates routes:', error);
}

try {
  app.use('/api/transactions', transactionsRoutes);
  console.log('✅ /api/transactions routes registered');
} catch (error) {
  console.error('❌ Failed to register /api/transactions routes:', error);
}

try {
  app.use('/api/lesson-progress', lessonProgressRoutes);
  console.log('✅ /api/lesson-progress routes registered');
} catch (error) {
  console.error('❌ Failed to register /api/lesson-progress routes:', error);
}

try {
  app.use('/api/system-logs', systemLogsRoutes);
  console.log('✅ /api/system-logs routes registered');
} catch (error) {
  console.error('❌ Failed to register /api/system-logs routes:', error);
}

try {
  app.use('/api/settings', settingsRoutes);
  console.log('✅ /api/settings routes registered');
} catch (error) {
  console.error('❌ Failed to register /api/settings routes:', error);
}

try {
  app.use('/api/firebase-auth', firebaseAuthRoutes);
  console.log('✅ /api/firebase-auth routes registered');
} catch (error) {
  console.error('❌ Failed to register /api/firebase-auth routes:', error);
}

// Test routes (for debugging)
try {
  app.use('/test', testRoutes);
  console.log('✅ /test routes registered');
} catch (error) {
  console.error('❌ Failed to register /test routes:', error);
}

// Test email route
try {
  const testEmailRoutes = (await import('./routes/test-email.js')).default;
  app.use('/api', testEmailRoutes);
  console.log('✅ /api/test-email routes registered');
} catch (error) {
  console.error('❌ Failed to register test-email routes:', error);
}

// Database test route
try {
  const dbTestRoutes = (await import('./routes/db-test.js')).default;
  app.use('/api/db', dbTestRoutes);
  console.log('✅ /api/db routes registered');
} catch (error) {
  console.error('❌ Failed to register db-test routes:', error);
}

// Test OTP route (for debugging)
try {
  const testOTPRoutes = (await import('./routes/test-otp.js')).default;
  app.use('/api', testOTPRoutes);
  console.log('✅ /api/test-otp routes registered');
} catch (error) {
  console.error('❌ Failed to register test-otp routes:', error);
}

// Debug: List all registered routes
console.log('\n📋 Registered Routes:');
app._router.stack.forEach((middleware, index) => {
  if (middleware.route) {
    const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
    console.log(`  ${index}. ${methods} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    console.log(`  ${index}. Router mounted at: ${middleware.regexp}`);
  } else if (middleware.name) {
    console.log(`  ${index}. Middleware: ${middleware.name}`);
  }
});
console.log('');

// Static files (ONLY after all API routes)
// IMPORTANT: Do NOT add express.static(CLIENT_BUILD_PATH) here
// It will intercept API routes. Only serve static files via the catch-all route below.
app.use('/docs', express.static(DOCS_PATH));

// Serve client static assets (CSS, JS, images, etc.) - but NOT index.html
// This allows API routes to work while still serving static assets
app.use('/client', express.static(CLIENT_BUILD_PATH));
app.use('/js', express.static(path.join(CLIENT_BUILD_PATH, 'js')));
app.use('/pages', express.static(path.join(CLIENT_BUILD_PATH, 'pages')));

// 404 handler for API and test routes (must be after all routes but before catch-all)
// This catches ALL requests that didn't match any route
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/test')) {
    console.error(`❌ Route not found: ${req.method} ${req.path}`);
    console.error(`   Available routes should include: POST /api/auth/login`);
    return res.status(404).json({ 
      error: `Route not found: ${req.method} ${req.path}`,
      availableRoutes: [
        'POST /api/auth/login',
        'POST /api/auth/register',
        'GET /api/auth/me',
        'POST /api/auth/verify-email',
        'GET /health',
        'GET /test/db',
        'GET /test/api'
      ]
    });
  }
  // For non-API routes, continue to catch-all
  next();
});

// Serve client files (only GET requests, must be last)
// Only serve index.html for non-API routes that don't match any route
app.get('*', (req, res, next) => {
  // Don't serve index.html for API or test routes
  if (req.path.startsWith('/api') || req.path.startsWith('/test') || req.path === '/health') {
    // Let 404 handler deal with it
    return next();
  }
  res.sendFile(path.join(CLIENT_BUILD_PATH, 'index.html'));
});

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Stitch LMS server listening on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`💡 Health check: http://localhost:${PORT}/health`);
  console.log(`💡 Test DB: http://localhost:${PORT}/test/db`);
});

