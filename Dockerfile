FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production

FROM nginx:alpine
# Remove ALL default nginx files
RUN rm -rf /usr/share/nginx/html/* && \
    rm -f /etc/nginx/conf.d/default.conf

# Copy your Angular files
COPY --from=builder /app/dist/browser/ /usr/share/nginx/html/

# Custom nginx config (no conflicts)
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # Never cache index.html
    location = /index.html {
        # 'no-store' is the most powerful directive; it tells the browser/CDN never to save it
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate" always;
        expires -1; # Sets the 'Expires' header to the past, forcing immediate expiration
    }

    # Cache static assets for a long time
    location ~* \.(?:css|js|jpg|jpeg|gif|png|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        # 'immutable' tells the browser the file will NEVER change, preventing unnecessary validation requests
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        access_log off;
        log_not_found off; # Prevents spamming error logs for missing favicons/assets
    }

    # SPA Routing fallback
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    gzip on;
    gzip_types text/css application/javascript;
}
EOF

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
