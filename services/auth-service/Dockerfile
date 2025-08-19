FROM node:18-alpine

# Install SQLite build tools
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Remove devDependencies
RUN npm prune --production

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3001

# Run service
CMD ["node", "dist/server.js"]
