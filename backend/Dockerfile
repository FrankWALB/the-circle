FROM node:24-alpine AS builder
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate
COPY . .
RUN npm run build

FROM node:24-alpine AS runner
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
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
