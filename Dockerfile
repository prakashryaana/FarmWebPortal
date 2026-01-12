# Multi-stage: Build Angular with Node 20, serve with nginx
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
# Use project name + configuration
RUN npx ng build FarmWebPortal --configuration production

# Production nginx server
FROM nginx:alpine AS runtime
COPY --from=builder /app/dist ./usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]