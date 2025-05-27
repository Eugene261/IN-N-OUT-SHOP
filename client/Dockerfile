# Build stage
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --silent

# Copy source code
COPY . .

# Build arguments
ARG VITE_API_URL
ARG VITE_PAYSTACK_PUBLIC_KEY

# Set environment variables
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_PAYSTACK_PUBLIC_KEY=$VITE_PAYSTACK_PUBLIC_KEY

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=build /app/dist /usr/share/nginx/html

# Add non-root user
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001 -G nginx

# Change ownership
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 