# How to Check if Server Receives Login API Request

## Quick Check Steps

### 1. **Verify Server is Running**

Open a terminal and check if the server is running:

```bash
cd server
npm run dev
```

You should see:
```
✅ Database connected successfully
📊 Database: lms_db
🚀 Stitch LMS server listening on http://localhost:5173
📡 API available at http://localhost:5173/api
```

### 2. **Check Server Logs**

When you try to login, watch the server console. You should see:

**If request reaches server:**
```
📥 POST /api/auth/login { body: { email: '...', password: '***' } }
🔐 Login endpoint hit!
Request body: { email: '...', password: '***' }
✅ Login attempt for email: ...
```

**If request doesn't reach server:**
- You'll see nothing in the console
- Or you'll see: `❌ API route not found: POST /api/auth/login`

### 3. **Test API Directly**

Use curl or Postman to test:

```bash
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"test123\"}"
```

Or use PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:5173/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"test@example.com","password":"test123"}'
```

### 4. **Check Browser Network Tab**

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try to login
4. Look for the `/api/auth/login` request
5. Check:
   - **Status**: Should be 200 (success) or 400/401 (error), NOT 404
   - **Request URL**: Should be `http://localhost:5173/api/auth/login`
   - **Request Method**: Should be `POST`
   - **Request Headers**: Should include `Content-Type: application/json`
   - **Request Payload**: Should show your email and password

### 5. **Common Issues**

#### Issue: "Cannot POST /api/auth/login"
**Cause**: Server not running OR wrong URL
**Fix**: 
- Start server: `cd server && npm run dev`
- Check URL in `client/js/api.js`: Should be `window.location.origin + '/api'`

#### Issue: 404 Not Found
**Cause**: Route not registered
**Fix**: Check `server/server.js` has `app.use('/api/auth', authRoutes);`

#### Issue: CORS Error
**Cause**: CORS not configured
**Fix**: Already fixed in `server.js` with `app.use(cors())`

#### Issue: Request reaches server but fails
**Cause**: Database or validation error
**Fix**: Check server console logs for detailed error

## Debugging Checklist

- [ ] Server is running (`npm run dev` in `server/` directory)
- [ ] Server shows startup messages (database connected, listening on port)
- [ ] Browser Network tab shows request being sent
- [ ] Server console shows request being received (`📥 POST /api/auth/login`)
- [ ] Server console shows login endpoint hit (`🔐 Login endpoint hit!`)
- [ ] Database connection is working (check `/health` endpoint)
- [ ] `.env` file exists in `server/` directory with correct DB credentials

## Test Endpoints

### Health Check
```bash
curl http://localhost:5173/health
```

### Test Database
```bash
curl http://localhost:5173/test/db
```

### Test API
```bash
curl http://localhost:5173/test/api
```

## What the Logs Mean

### ✅ Good Signs:
- `📥 POST /api/auth/login` - Request received
- `🔐 Login endpoint hit!` - Route handler executed
- `✅ Login attempt for email: ...` - Processing started

### ❌ Bad Signs:
- `❌ API route not found` - Route not registered
- `Cannot POST /api/auth/login` - Server not running or wrong URL
- No logs at all - Request not reaching server

## Next Steps

1. **Start the server** and keep the console open
2. **Open browser DevTools** (Network tab)
3. **Try to login** from the page
4. **Check both**:
   - Browser Network tab (client side)
   - Server console (server side)
5. **Compare** what you see with the expected logs above

