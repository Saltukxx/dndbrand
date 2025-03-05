# Database Management Scripts

This directory contains scripts for managing the DnD Brand MongoDB database. These scripts help with database initialization, backup, cleanup, monitoring, and schema migrations.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Environment variables properly configured in `../config/.env`

## Available Scripts

### Seed Database

Initializes the database with sample data for development or testing.

```bash
node seed.js
```

This script will:
- Clear existing data (use with caution!)
- Create sample users, customers, products, and orders
- Set up relationships between entities

### Backup and Restore

Backs up the database to a file or restores from a backup file.

```bash
# Create a backup
node backup.js

# Restore from a specific backup
node backup.js restore --path=../backups/backup-2023-06-01.gz
```

### Database Cleanup

Performs maintenance tasks on the database to remove old or unnecessary data.

```bash
# Default cleanup (30 days)
node cleanup.js

# Cleanup with custom days threshold
node cleanup.js --days=60

# Cleanup and archive old orders
node cleanup.js --archive-orders --days=90
```

### Database Monitoring

Monitors database health and performance.

```bash
# Basic monitoring (console output)
node monitor.js

# Detailed monitoring with verbose output
node monitor.js --verbose

# Output monitoring report to JSON file
node monitor.js --output=json
```

### Database Migrations

Manages database schema changes through versioned migrations.

```bash
# Show migration status
node migrate.js status

# Apply all pending migrations
node migrate.js up

# Rollback the last applied migration
node migrate.js down

# Rollback to a specific version
node migrate.js down --to=20230101

# Create a new migration file
node migrate.js create "Add customer loyalty points"
```

## Migration Files

Migration files are stored in the `../migrations` directory and follow this naming convention:

```
YYYYMMDD-description-of-changes.js
```

Each migration file exports two functions:
- `up`: Code to apply the migration
- `down`: Code to roll back the migration

Example migration file:

```javascript
module.exports = {
  up: async (mongoose) => {
    // Code to apply changes
    const db = mongoose.connection.db;
    await db.collection('users').updateMany({}, { $set: { newField: 'defaultValue' } });
  },
  
  down: async (mongoose) => {
    // Code to roll back changes
    const db = mongoose.connection.db;
    await db.collection('users').updateMany({}, { $unset: { newField: '' } });
  }
};
```

## Best Practices

1. **Always back up your database** before running migrations or cleanup scripts
2. **Test migrations** in a development environment before applying to production
3. **Keep migrations small and focused** on specific changes
4. **Include both up and down methods** in migrations for reversibility
5. **Run monitoring regularly** to identify performance issues
6. **Schedule regular backups** using a cron job or similar scheduler

## Troubleshooting

If you encounter issues:

1. Check MongoDB connection string in your `.env` file
2. Ensure MongoDB is running and accessible
3. Check for sufficient disk space for backups
4. Verify that your Node.js version is compatible
5. Look for error messages in the console output

For persistent issues, check the MongoDB logs or contact the development team. 