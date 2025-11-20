# Code Review Report

## Issues Found

### 🔴 Critical Issues

1. **Cart API JSONB Handling** (`server/routes/cart.js`)
   - **Issue**: Using `JSON.stringify()` when PostgreSQL `pg` library handles JSON automatically
   - **Location**: Lines 89, 118
   - **Fix**: Pass JavaScript object directly, let `pg` handle serialization
   - **Impact**: May cause double-stringification or type issues

2. **Type Consistency in Cart API** (`server/routes/cart.js`)
   - **Issue**: `course_id` comparison may have type mismatch (string vs integer)
   - **Location**: Line 74, 114
   - **Fix**: Ensure consistent type conversion (parseInt or compare as string)

3. **Missing social_link Column** (`server/database/schema.sql`)
   - **Issue**: `social_link` column not in main schema, only in migration
   - **Location**: `schema.sql` line 39
   - **Fix**: Add `social_link VARCHAR(500)` to users table in schema.sql

### 🟡 Medium Priority Issues

4. **Client Code Still Using localStorage**
   - **Issue**: Many client pages still use localStorage instead of API
   - **Files**: 
     - `client/pages/cart-checkout/code.html`
     - `client/pages/profile-settings/code.html`
     - `client/pages/course-catalog/index.html`
   - **Fix**: Update to use API endpoints

5. **Error Handling in Cart API**
   - **Issue**: Clear cart endpoint doesn't check if user_preferences exists
   - **Location**: `server/routes/cart.js` line 129
   - **Fix**: Add existence check or use UPSERT pattern

6. **Profile Settings Selector Issues**
   - **Issue**: Using `:contains()` pseudo-selector which doesn't exist in standard DOM
   - **Location**: `client/pages/profile-settings/code.html` lines 181, 187, 193, 199, 210, 320
   - **Fix**: Use proper selectors or data attributes

### 🟢 Low Priority / Improvements

7. **Cart API Response Format**
   - **Suggestion**: Ensure consistent response format (always return `{ cart: [...] }`)

8. **Migration Script Error Handling**
   - **Suggestion**: Add better error messages for common issues

9. **API Documentation**
   - **Suggestion**: Add JSDoc comments to API methods

## Files Reviewed

### Server Side ✅
- ✅ `server/routes/cart.js` - Cart API endpoints
- ✅ `server/routes/users.js` - User profile endpoints
- ✅ `server/server.js` - Route registration
- ✅ `server/database/migration_add_cart.sql` - Database migration
- ⚠️ `server/database/schema.sql` - Missing social_link column

### Client Side ⚠️
- ⚠️ `client/js/api.js` - API client (needs review)
- ⚠️ `client/pages/cart-checkout/code.html` - Still uses localStorage
- ⚠️ `client/pages/profile-settings/code.html` - Still uses localStorage, selector issues
- ⚠️ `client/pages/course-catalog/index.html` - Still uses localStorage

## Recommendations

1. **Immediate Fixes Needed:**
   - Fix JSONB handling in cart API
   - Add social_link to schema.sql
   - Fix type consistency in cart API
   - Fix profile settings selectors

2. **Next Steps:**
   - Update all client pages to use API
   - Remove localStorage usage (except authToken and theme)
   - Add comprehensive error handling
   - Add API response validation

3. **Testing:**
   - Test cart add/remove/clear operations
   - Test profile update operations
   - Test error scenarios (network failures, invalid data)
   - Test type conversions (string vs integer IDs)

## Status Summary

- **Server API**: 90% Complete (minor fixes needed)
- **Database**: 95% Complete (missing social_link in main schema)
- **Client Integration**: 30% Complete (needs major updates)
- **Error Handling**: 70% Complete (needs improvement)

