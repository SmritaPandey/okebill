FROM node:20-alpine

WORKDIR /app

# Copy server package files
COPY server/package*.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema
COPY server/prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy server source code
COPY server/tsconfig.json ./
COPY server/src ./src

# Build TypeScript
RUN npx tsc

# Expose port
EXPOSE 4000

# Start: run migrations then server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
