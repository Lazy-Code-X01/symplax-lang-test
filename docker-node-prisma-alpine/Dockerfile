# node:alpine + Prisma. Deliberately does NOT `apk add openssl` — Symplax's
# builder injects it automatically so the Prisma musl query-engine can load.
# This is exactly the case that used to bake the wrong engine and crash at runtime.
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["node", "index.js"]
