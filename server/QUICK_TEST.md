# Quick Testing Guide

## 🚀 Fast Start

### 1. Install & Setup
```bash
cd server
npm install
```

### 2. Run All Tests
```bash
npm test
```

### 3. Manual Testing
```bash
# Start server
npm run dev

# In another terminal, test API
curl http://localhost:5173/health
```

---

## 📋 Test Commands Cheat Sheet

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:unit` | Unit tests only |
| `npm run test:system` | API/system tests |
| `npm run test:integration` | Integration tests |
| `npm run test:coverage` | With coverage report |
| `npm run test:watch` | Auto-rerun on changes |

---

## 🧪 Quick Test Examples

### Test Login
```bash
# Register
curl -X POST http://localhost:5173/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","firstName":"Test","lastName":"User","role":"student"}'

# Login
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'
```

### Test OTP Login
```bash
# Request OTP
curl -X POST http://localhost:5173/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com"}'

# Login with OTP (use code from response in dev mode)
curl -X POST http://localhost:5173/api/auth/login-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","otp":"123456"}'
```

---

## ✅ Test Checklist

- [ ] All automated tests pass: `npm test`
- [ ] Health check works: `curl http://localhost:5173/health`
- [ ] Registration works
- [ ] Password login works
- [ ] OTP login works
- [ ] Protected routes require auth
- [ ] Courses can be created/updated/deleted

---

For detailed testing guide, see `TESTING_GUIDE.md`

