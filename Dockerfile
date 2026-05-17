FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm install --production --legacy-peer-deps
COPY --from=builder /app/dist ./dist
RUN mkdir -p uploads/drivers uploads/vehicles uploads/rentals
EXPOSE 3001
CMD ["node", "dist/main"]
