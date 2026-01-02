#!/bin/sh
# Initialization script for Railway deployment

echo "Running database migrations..."
node migrations/add-unsigned-agreement-fields.js || echo "Migration completed or columns already exist"

echo "Running database seed..."
node seed.js || echo "Seed completed or admin already exists"

echo "Starting application..."
node index.js
