# Server Setup Guide

## Required Modifications Made

### 1. Enhanced Database Connection (`server/config/database.js`)
- ✅ Added connection test on startup
- ✅ Better error messages
- ✅ Increased connection timeout to 5 seconds
- ✅ Helpful troubleshooting messages

### 2. Improved Server Configuration (`server/server.js`)
- ✅ Enhanced CORS configuration with credentials support
- ✅ Increased request body size limit (10mb)
- ✅ Global error handling middleware
- ✅ Health check endpoint with database status
- ✅ Test routes for debugging

### 3. Better Error Handling (`server/routes/auth.js`)
- ✅ Database connection error detection
- ✅ Unique constraint violation handling
- ✅ Detailed error logging
- ✅ Development vs production error messages

### 4. Test Routes (`server/routes/test.js`)
- ✅ Database connection test endpoint
- ✅ API status check endpoint

## Setup Steps

### 1. Create `.env` File

Create `server/.env` file:

```bash
cd server
cp .env.example .env
```

Then edit `.env` with your database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lms_db
DB_USER=postgres
DB_PASSWORD=your_password_here
JWT_SECRET=your-secret-key-change-this-in-production-min-32-characters
JWT_EXPIRES_IN=7d
PORT=5173
NODE_ENV=development
```

### 2. Install Dependencies

```bash
cd server
npm install
```

### 3. Setup Database

```bash
# Create database
createdb lms_db

# Or using psql:
psql -U postgres
CREATE DATABASE lms_db;

# Run schema
psql -U postgres -d lms_db -f ../database/schema.sql
psql -U postgres -d lms_db -f ../database/schema_content_library.sql
psql -U postgres -d lms_db -f ../database/init.sql
```

### 4. Start Server

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

## Testing Endpoints

### Health Check
```bash
curl http://localhost:5173/health
```

### Test Database Connection
```bash
curl http://localhost:5173/test/db
```

### Test API
```bash
curl http://localhost:5173/test/api
```

### Test Login
```bash
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Troubleshooting

### Database Connection Issues

1. **Check PostgreSQL is running:**
   ```bash
   # Windows
   Get-Service postgresql*
   
   # Linux/Mac
   sudo systemctl status postgresql
   ```

2. **Verify database exists:**
   ```bash
   psql -U postgres -l
   ```

3. **Test connection manually:**
   ```bash
   psql -U postgres -d lms_db -c "SELECT 1;"
   ```

4. **Check .env file:**
   - Ensure `.env` file exists in `server/` directory
   - Verify all credentials are correct
   - No spaces around `=` signs

### Common Errors

1. **"Database connection failed"**
   - PostgreSQL not running
   - Wrong credentials in `.env`
   - Database doesn't exist

2. **"ECONNREFUSED"**
   - PostgreSQL service not started
   - Wrong port number
   - Firewall blocking connection

3. **"User already exists"**
   - Email already registered
   - Try different email or delete existing user

## Server Features

### Error Handling
- Database connection errors are caught and returned with helpful messages
- Validation errors are properly formatted
- Development mode shows detailed error stacks

### Logging
- All API requests are logged (morgan)
- Database connections are logged
- Errors include stack traces in development

### Security
- CORS configured (can be restricted in production)
- JWT token authentication
- Password hashing with bcrypt
- Input validation with express-validator

## Production Considerations

1. **Change JWT_SECRET** - Use a strong, random secret
2. **Set NODE_ENV=production** - Disables detailed error messages
3. **Restrict CORS_ORIGIN** - Set to your actual domain
4. **Use environment variables** - Never commit `.env` file
5. **Enable HTTPS** - Use reverse proxy (nginx) or SSL certificate
6. **Database connection pooling** - Already configured (max 20 connections)
7. **Rate limiting** - Consider adding express-rate-limit
8. **Logging** - Consider using winston or similar for production logs

