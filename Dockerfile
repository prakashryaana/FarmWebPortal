FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production=false
COPY . .

RUN npm run build

EXPOSE 80
CMD ["npx", "serve", "dist", "-s", "-l", "80"]