# VIAN Academy LMS Database

This directory contains the database schema and initialization scripts for the VIAN Academy Learning Management System.

## Files

- `schema.sql` - PostgreSQL database schema
- `schema_mysql.sql` - MySQL/MariaDB database schema
- `init.sql` - Database initialization script (optional sample data)

## Database Requirements

### PostgreSQL
- Version: 12.0 or higher
- Extensions: None required

### MySQL/MariaDB
- Version: 8.0 or higher
- Engine: InnoDB
- Character Set: utf8mb4
- Collation: utf8mb4_unicode_ci

## Quick Start

### PostgreSQL

```bash
# Create database
createdb vian_academy_lms

# Run schema
psql -d vian_academy_lms -f schema.sql
```

### MySQL

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE vian_academy_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run schema
mysql -u root -p vian_academy_lms < schema_mysql.sql
```

## Database Structure

### Core Tables

1. **users** - User accounts (students, instructors, admins)
2. **categories** - Course categories
3. **courses** - Course information
4. **modules** - Course modules
5. **lessons** - Individual lessons
6. **enrollments** - Student course enrollments
7. **lesson_progress** - Student progress tracking

### Financial Tables

8. **transactions** - Payment transactions
9. **coupons** - Discount coupons

### Content Tables

10. **certificates** - Course completion certificates
11. **reviews** - Course reviews and ratings
12. **forum_topics** - Forum discussion topics
13. **forum_replies** - Forum replies

### System Tables

14. **system_logs** - System activity logs
15. **settings** - System configuration
16. **notifications** - User notifications

## Key Features

### Automatic Updates

The database includes triggers and functions to automatically:
- Update course enrollment counts
- Update course ratings
- Update forum reply counts
- Update timestamps

### Indexes

All tables include appropriate indexes for:
- Foreign keys
- Frequently queried columns
- Search operations

### Constraints

- Foreign key constraints for referential integrity
- Check constraints for data validation
- Unique constraints where appropriate

## Sample Data

The schema includes initial data:
- Default admin user
- Sample categories
- System settings

**Note**: The default admin password should be changed in production!

## Connection String Examples

### PostgreSQL
```
postgresql://username:password@localhost:5432/vian_academy_lms
```

### MySQL
```
mysql://username:password@localhost:3306/vian_academy_lms
```

## Backup and Restore

### PostgreSQL Backup
```bash
pg_dump -U username vian_academy_lms > backup.sql
```

### PostgreSQL Restore
```bash
psql -U username vian_academy_lms < backup.sql
```

### MySQL Backup
```bash
mysqldump -u username -p vian_academy_lms > backup.sql
```

### MySQL Restore
```bash
mysql -u username -p vian_academy_lms < backup.sql
```

## Security Notes

1. **Passwords**: Always hash passwords using bcrypt before storing
2. **Connection**: Use SSL/TLS for database connections in production
3. **Permissions**: Grant minimal required permissions to application users
4. **Backups**: Regular automated backups are essential
5. **Updates**: Keep database software updated

## Performance Considerations

1. **Indexes**: Additional indexes may be needed based on query patterns
2. **Partitioning**: Consider partitioning large tables (logs, transactions)
3. **Caching**: Implement caching for frequently accessed data
4. **Connection Pooling**: Use connection pooling in applications

## Migration Notes

When updating the schema:
1. Always backup the database first
2. Test migrations on a development database
3. Use transactions for multi-step migrations
4. Document all schema changes

## Support

For database-related issues, refer to:
- ERD Documentation: `docs/ERD.md`
- SRS Documentation: `docs/SRS.md`

---

**Last Updated**: 2024-01-20

