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
    listen 4200;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    gzip on;
    gzip_types text/css application/javascript;
}
EOF

EXPOSE 4200
CMD ["nginx", "-g", "daemon off;"]
