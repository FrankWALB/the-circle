FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN DATABASE_URL=postgresql://thecircle:thecircle@postgres:5432/thecircle npx prisma generate
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
