# Етап 1: Билдване на приложението
FROM node:20-alpine AS builder
WORKDIR /app

# Копираме файловете за зависимостите
COPY package.json package-lock.json ./
RUN npm install

# Копираме целия код и билдваме
COPY . .
RUN npm run build

# Етап 2: Запускане на приложението
FROM node:20-alpine AS runner
WORKDIR /app

# Настройваме производствена среда
ENV NODE_ENV=production

# Копираме само необходимото от предния етап
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Стартираме Next.js
EXPOSE 3000
CMD ["npm", "start"]
