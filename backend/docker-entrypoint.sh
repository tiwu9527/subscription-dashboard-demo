#!/bin/sh
set -e

mkdir -p /app/data
npm run prisma:deploy

exec "$@"
