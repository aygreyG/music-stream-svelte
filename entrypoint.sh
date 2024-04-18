#!/bin/sh

MIGRATION_STATUS=$(npx prisma migrate status --schema /app/prisma/schema.prisma)

if echo "$MIGRATION_STATUS" | grep -q "Database schema is up to date"; then
    echo "No migrations needed."
else
    echo "Running migrations..."
    npx prisma migrate deploy
fi

node /app/build