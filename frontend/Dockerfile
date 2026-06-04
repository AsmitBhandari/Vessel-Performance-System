# Stage 1: Build React static assets
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build-time environment variable for backend API endpoint
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build for production
RUN npm run build

# Stage 2: Serve build artifacts using Nginx
FROM nginx:alpine

# Copy custom Nginx configuration for single page application (SPA) fallback
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Copy build files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
