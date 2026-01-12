FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx ng build FarmWebPortal --configuration production

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Simplified nginx - no custom config needed
RUN rm /etc/nginx/conf.d/default.conf && \
    echo 'server { listen 80; root /usr/share/nginx/html; location / { try_files \$uri \$uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
