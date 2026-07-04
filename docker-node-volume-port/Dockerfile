# Non-standard port (5000) + a persistent VOLUME — exercises Symplax's EXPOSE
# port detection and VOLUME detection at the same time.
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
VOLUME /data
EXPOSE 5000
CMD ["node", "server.js"]
