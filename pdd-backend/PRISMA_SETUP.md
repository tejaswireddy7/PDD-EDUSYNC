# Prisma Migrations & Database Setup Guide

## Quick Start

### SQLite (Local Development - Recommended)

For fastest local development with zero external dependencies:

\`\`\`bash
# 1. Set DATABASE_URL in .env
DATABASE_URL="file:./prisma/dev.db"

# 2. Initialize database
npm run prisma:push

# 3. (Optional) Open Prisma Studio
npm run prisma:studio
\`\`\`

SQLite database will be created at `prisma/dev.db`

### PostgreSQL (Production)

For production deployments:

\`\`\`bash
# 1. Ensure PostgreSQL is running
# brew services start postgresql  # macOS
# sudo service postgresql start   # Linux
# Docker: docker run -d -e POSTGRES_PASSWORD=password postgres:15

# 2. Set DATABASE_URL in .env
DATABASE_URL="postgresql://user:password@localhost:5432/edusync_db"

# 3. Create migration
npm run prisma:migrate

# 4. Name your migration (e.g., "init")
# This creates prisma/migrations/[timestamp]_init/migration.sql

# 5. Schema is automatically applied
\`\`\`

## Database Operations

### Initialize/Reset Database

\`\`\`bash
# Push schema changes to database (dev)
npm run prisma:push

# Create a named migration
npm run prisma:migrate -- --name add_users

# Migrate database to latest
npm run prisma:migrate

# Reset database completely (DANGEROUS - clears all data)
npx prisma migrate reset
\`\`\`

### Inspect Database

\`\`\`bash
# Open Prisma Studio (GUI browser interface)
npm run prisma:studio

# Generate Prisma client
npm run prisma:generate
\`\`\`

## Migration Workflow

### Development (SQLite)

\`\`\`bash
# 1. Edit prisma/schema.prisma
# 2. Run:
npm run prisma:push
# 3. Done - no migration files needed for SQLite

# 4. Regenerate types:
npm run prisma:generate
\`\`\`

### Production (PostgreSQL with Migrations)

\`\`\`bash
# 1. Edit prisma/schema.prisma

# 2. Create migration:
npm run prisma:migrate -- --name describe_change

# This creates: prisma/migrations/[timestamp]_describe_change/

# 3. Review SQL file in migrations folder

# 4. Apply migration:
npm run prisma:migrate

# 5. Deploy: migrations automatically run on \`npm start\`
\`\`\`

## Environment Setup

### Local Development (.env)

\`\`\`env
DATABASE_URL="file:./prisma/dev.db"
NODE_ENV=development
\`\`\`

### Production (.env)

\`\`\`env
DATABASE_URL="postgresql://user:password@prod-db.example.com:5432/edusync_db"
NODE_ENV=production
\`\`\`

### Docker Compose

\`\`\`bash
# Start PostgreSQL + Backend
docker-compose up -d

# Stop everything
docker-compose down

# View logs
docker-compose logs -f backend
\`\`\`

## Common Scenarios

### Adding a New Table

\`\`\`prisma
model YourModel {
  id    String  @id @default(cuid())
  name  String
}
\`\`\`

Then:
\`\`\`bash
npm run prisma:push  # (SQLite)
# OR
npm run prisma:migrate -- --name add_your_model  # (PostgreSQL)
\`\`\`

### Modifying Existing Column

Edit schema.prisma, then:

\`\`\`bash
npm run prisma:push  # (SQLite)
# OR
npm run prisma:migrate -- --name update_column_name  # (PostgreSQL)
\`\`\`

### Switching from SQLite to PostgreSQL

\`\`\`bash
# 1. Update .env
DATABASE_URL="postgresql://user:password@localhost:5432/edusync_db"

# 2. Create fresh PostgreSQL instance:
npm run prisma:migrate reset

# This applies current schema to PostgreSQL
\`\`\`

## Troubleshooting

### Database Lock (SQLite)

\`\`\`bash
# Remove dev.db files
rm prisma/dev.db
rm prisma/dev.db-journal

# Reinitialize
npm run prisma:push
\`\`\`

### PostgreSQL Connection Failed

\`\`\`bash
# Check if PostgreSQL running:
pg_isready

# Start PostgreSQL:
sudo service postgresql start  # Linux
brew services start postgresql  # macOS
docker run -d -e POSTGRES_PASSWORD=password postgres:15  # Docker
\`\`\`

### Prisma Client Out of Sync

\`\`\`bash
# Regenerate client:
npm run prisma:generate
\`\`\`

### Migration Conflicts

\`\`\`bash
# Reset (WARNING - deletes data):
npx prisma migrate reset

# Or manually resolve in prisma/migrations/
\`\`\`

## Deployment Checklist

- [ ] PostgreSQL database created
- [ ] DATABASE_URL environment variable set
- [ ] Run: \`npm run prisma:migrate\`
- [ ] Verify schema applied: \`npm run prisma:studio\`
- [ ] Test API endpoints
- [ ] Backup database before production deploy

## Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma Migrate Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL Installation](https://www.postgresql.org/download/)
- [Prisma Studio](https://www.prisma.io/studio)
