FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

ENV DATABASE_URL=file:/app/data/prod.db

COPY prisma ./prisma
RUN npx prisma generate

COPY server.js docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh \
  && mkdir -p /app/data \
  && chown -R node:node /app

ENV NODE_ENV=production
ENV PORT=3001

USER node

EXPOSE 3001

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start"]
