#!/bin/sh
# Initialization script for Railway deployment

echo "Running database seed..."
node seed.js || echo "Seed completed or admin already exists"

echo "Starting application..."
node index.js
