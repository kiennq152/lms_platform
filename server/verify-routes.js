// Verify routes are properly set up
import express from 'express';

const app = express();

// Simulate route registration
console.log('Testing route registration...');

const router = express.Router();
router.post('/login', (req, res) => {
  res.json({ message: 'Login route works!' });
});

app.use('/api/auth', router);

// Test if route is registered
const stack = app._router.stack;
console.log('\n📋 Router Stack:');
stack.forEach((middleware, index) => {
  if (middleware.route) {
    console.log(`  ${index}. Route: ${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    console.log(`  ${index}. Router: ${middleware.regexp}`);
  } else {
    console.log(`  ${index}. ${middleware.name || 'Middleware'}`);
  }
});

console.log('\n✅ Route registration test complete');


