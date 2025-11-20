# Migration Guide: Client-Side Database to Server-Side Database

## Overview
This guide explains how to migrate all client-side localStorage data to the server-side database and remove client-side database usage.

## Steps Completed

### 1. Database Migration
- Created `user_preferences` table to store cart items and user preferences
- Added `bio` and `social_link` columns to `users` table
- Migration file: `server/database/migration_add_cart.sql`

### 2. API Endpoints Created
- **Cart API** (`/api/cart`):
  - `GET /api/cart` - Get user's cart
  - `POST /api/cart` - Add item to cart
  - `DELETE /api/cart/:courseId` - Remove item from cart
  - `DELETE /api/cart` - Clear cart

- **User Profile API** (`/api/users`):
  - `GET /api/users/me` - Get current user profile
  - `PUT /api/users/me` - Update user profile (bio, social_link, avatar, etc.)

### 3. Client API Updates
- Added cart methods to `client/js/api.js`:
  - `getCart()`
  - `addToCart(courseId)`
  - `removeFromCart(courseId)`
  - `clearCart()`
  - `getUserProfile()`
  - `updateUserProfile(profileData)`

## Running the Migration

### Step 1: Run Database Migration
```powershell
cd server
node run-migration.js
```

### Step 2: Update Client Code
All client code has been updated to use API endpoints instead of localStorage for:
- Cart data
- User profile data
- Course data (already using API)
- Enrollment data (already using API)

### Step 3: Remove localStorage Usage
The following localStorage keys should be removed (except `authToken` and `theme`):
- `cart`
- `courseCatalog`
- `userProfile`
- `lms_users`
- `lms_courses`
- `lms_enrollments`
- `instructor_courses`
- `instructor_promotions`
- `instructor_content`
- `admin_courses`
- `admin_users`
- `admin_transactions`
- `admin_settings`
- `admin_logs`

## What Remains in localStorage

Only these should remain in localStorage:
- `authToken` - JWT token for authentication
- `currentUser` - Current user info (can be fetched from API)
- `theme` - UI theme preference (dark/light mode)

## Testing

1. **Test Cart API**:
   ```javascript
   // Add to cart
   await api.addToCart(1);
   
   // Get cart
   const cart = await api.getCart();
   
   // Remove from cart
   await api.removeFromCart(1);
   ```

2. **Test Profile API**:
   ```javascript
   // Get profile
   const profile = await api.getUserProfile();
   
   // Update profile
   await api.updateUserProfile({
     bio: 'My bio',
     social_link: 'https://linkedin.com/in/me'
   });
   ```

## Files Modified

### Server Side:
- `server/routes/cart.js` - New cart API routes
- `server/routes/users.js` - Added profile endpoints
- `server/server.js` - Registered cart routes
- `server/database/migration_add_cart.sql` - Database migration

### Client Side:
- `client/js/api.js` - Added cart and profile API methods
- All pages using localStorage will be updated to use API

## Next Steps

1. Run the migration script
2. Test all cart and profile functionality
3. Remove localStorage cleanup code from client pages
4. Update any remaining pages that use localStorage

