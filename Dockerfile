FROM node:20-alpine

WORKDIR /app

# Copy server package files and prisma schema FIRST
COPY server/package*.json ./
COPY server/prisma ./prisma

# Install dependencies (postinstall will find prisma schema)
RUN npm install

# Generate Prisma client explicitly
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
