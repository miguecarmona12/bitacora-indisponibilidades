FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Allow passing the API URL at build time so Vite inlines the correct endpoint
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

EXPOSE 5173

# Add runtime entrypoint that writes env-config.js using $VITE_API_URL
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]