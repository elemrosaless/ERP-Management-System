# Soft Delete Implementation - ERP Management System

## Overview

This ERP backend implements **soft delete** (logical deletion) using a hybrid approach that's industry-standard in real ERP systems:

- **`is_active` BOOLEAN**: Fast boolean flag for filtering (operational)
- **`deleted_at` TIMESTAMP**: Audit trail recording when record was deleted (compliance)

## What is Soft Delete in Real ERPs?

❌ **Hard Delete (WRONG):**
```sql
DELETE FROM core.users WHERE id = 5;
-- Problem: Loses audit trail, breaks historical records, orphans foreign keys
```

✅ **Soft Delete (CORRECT ERP Pattern):**
```sql
UPDATE core.users SET is_active = false, deleted_at = NOW() WHERE id = 5;
-- Benefit: Fast filtering + complete audit trail
```

### Why Two Fields?

| Field | Purpose | Performance | Example |
|-------|---------|-------------|---------|
| **`is_active`** | Quick filter for active/inactive records | O(1) index scan | `WHERE is_active = true` |
| **`deleted_at`** | Audit trail (WHEN was deleted) | Compliance, accountability | `WHERE deleted_at IS NOT NULL` |

**In every ERP query:**
```sql
SELECT * FROM core.users WHERE is_active = true  -- Fast ✓
```

**For audits:**
```sql
SELECT id, name, deleted_at FROM core.users WHERE is_active = false  -- Who was deleted and when
```

## Database Schema

All tables have two soft-delete columns:

```sql
-- Migration: 001_add_soft_delete.sql
ALTER TABLE core.users 
    ADD COLUMN is_active BOOLEAN DEFAULT true,
    ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;

-- Indexes for performance
CREATE INDEX idx_users_is_active ON core.users(is_active);
CREATE INDEX idx_users_deleted_at ON core.users(deleted_at);
CREATE INDEX idx_users_is_active_deleted_at ON core.users(is_active, deleted_at);

-- Partial index for common operations (only active)
CREATE INDEX idx_users_email_active ON core.users(LOWER(email)) WHERE is_active = true;
```

### Applied Changes

#### 1. **users.py** ✓
```python
# GET / - List active users
WHERE is_active = true

# POST / - Create user
SELECT id FROM core.users 
WHERE LOWER(email) = LOWER(:email) AND is_active = true

# GET /{id} - Get user
WHERE id = :id AND is_active = true

# PUT /{id} - Update user
WHERE id = :id AND is_active = true
AND LOWER(email) = LOWER(:email) AND id != :user_id AND is_active = true (validation)

# DELETE /{id} - Soft delete
UPDATE core.users SET is_active = false, deleted_at = NOW() 
WHERE id = :id AND is_active = true
```

#### 2. **products.py** ✓
```python
# GET / - List active products
WHERE is_active = true

# GET /{id} - Get product
WHERE id = :id AND is_active = true

# PUT /{id} - Update product
WHERE id = :id AND is_active = true

# DELETE /{id} - Soft delete
UPDATE core.products SET is_active = false, deleted_at = NOW() 
WHERE id = :id AND is_active = true
```

#### 3. **sales.py** ✓
```python
# POST / - Create sale
UPDATE core.products
SET stock = stock - :quantity
WHERE id = :id AND stock >= :quantity AND is_active = true
```

#### 4. **reports.py** ✓
```python
# /summary
WHERE is_active = true

# /sales-by-day
WHERE is_active = true

# /top-products
WHERE si.is_active = true AND p.is_active = true

# /top-customers
WHERE s.is_active = true
```

### Login & Authentication

The `auth.py` module's login endpoint only allows active users:

```python
# In main.py - login() endpoint
SELECT * FROM core.users 
WHERE LOWER(email) = LOWER(:email) AND is_active = true
```

## Usage Examples

### Admin Deletes a User

**Request:**
```bash
DELETE /users/5 (as admin)
```

**Database Effect:**
```sql
UPDATE core.users SET is_active = false, deleted_at = NOW() WHERE id = 5 AND is_active = true
```

**Results:**
- User 5 disappears from `GET /users` (filter: `WHERE is_active = true`)
- User 5 disappears from `GET /users/5` (returns 404)
- User 5 cannot login (`is_active = true` check)
- User 5's historical sales remain intact ✓
- `deleted_at` stores the exact deletion timestamp for audit

### Reporting Integrity

**Scenario:** User X made 100 sales, then account is deleted

**Before Soft Delete (Bad):**
- Sales records are orphaned (customer_id points to non-existent user)
- Reports show 0 for that user's sales
- Audit trail is broken ✗

**After Soft Delete (Good):**
- Sales records still reference the user ✓
- Reports show correct historical data ✓
- Audit trail is preserved ✓

## Testing Soft Delete

```bash
# 1. Create a user
curl -X POST http://localhost:8000/users \
  -H "Authorization: Bearer {admin_token}" \
  -d '{"name":"Test User", "email":"test@example.com", "password":"Secure123!"}'

# 2. Get user (should exist)
curl http://localhost:8000/users/1

# 3. Delete user (soft delete)
curl -X DELETE http://localhost:8000/users/1 \
  -H "Authorization: Bearer {admin_token}"

# 4. Get user (should return 404)
curl http://localhost:8000/users/1

# 5. Query database directly (record still exists with audit trail)
SELECT id, name, is_active, deleted_at FROM core.users WHERE id = 1;
-- Result: 1 | Test User | false | 2026-06-11 10:30:45
```

## Restoring Deleted Records

For critical situations, records can be restored:

```sql
-- Admin-only SQL command (use with caution)
UPDATE core.users SET is_active = true, deleted_at = NULL WHERE id = 5;
```

## Migration Steps

1. **Run migration SQL** in PostgreSQL:
   ```bash
   psql -U postgres -d erp_db -f migrations/001_add_soft_delete.sql
   ```

2. **Verify columns added:**
   ```sql
   \d core.users
   -- Should show: 
   --   is_active | boolean | DEFAULT true
   --   deleted_at | timestamp without time zone | NULL
   ```

3. **Deploy updated backend code**

4. **Test all DELETE endpoints** to verify soft delete behavior

## Performance Notes

- **`is_active` Index**: O(1) boolean index for fast active/inactive filtering (primary)
- **`deleted_at` Index**: Records audit trail without impacting query performance
- **Composite Index**: `(is_active, deleted_at)` for combined queries
- **Partial Index**: `WHERE is_active = true` partial indexes are ultra-efficient
- **Query Performance**: Adding `WHERE is_active = true` is negligible (index lookup)
- **Scalability**: Scales to millions of records with minimal performance impact

## Security Considerations

- Soft-deleted records are **completely hidden** from users via API
- Only direct database queries with appropriate permissions can see deleted records
- This is functionally equivalent to hard delete from a user perspective
- Provides recovery capability for legitimate business needs

## Future Enhancements

1. **Status Field**: Extend `is_active` to multi-state: 'active', 'inactive', 'suspended', 'archived'
2. **Restore Endpoint**: `POST /users/{id}/restore` for admins with audit trail
3. **Audit Logging**: Track WHO deleted and restored records
4. **Prune Old Records**: Archive very old soft-deleted records (90+ days) to separate archive DB
5. **Deletion Timeline**: Show deletion history and reason for compliance reports
6. **Soft Delete Policies**: Different retention periods per record type (e.g., users: 2 years, transactions: 7 years)
