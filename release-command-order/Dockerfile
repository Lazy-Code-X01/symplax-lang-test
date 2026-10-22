# An app that refuses to start until its release command has run.
# VOLUME /data is what lets the one-off release container and the app container
# share the migration state, the same way they would share a database.
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY . .
VOLUME /data
EXPOSE 3000
CMD ["node", "server.js"]
