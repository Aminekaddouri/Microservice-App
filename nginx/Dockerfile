# Multi-stage build: First, build the frontend
FROM node:22-alpine AS builder

WORKDIR /app

# Copy frontend package files
COPY client/package*.json ./
RUN npm install

# Copy frontend source
COPY client/src ./src
COPY client/index.html ./
COPY client/vite.config.ts ./
COPY client/tailwind.config.cjs ./
COPY client/postcss.config.ts ./
COPY client/tsconfig.json ./

# Build frontend
RUN npm run build


# Final stage: Nginx
FROM nginx:alpine

# Remove default config
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]