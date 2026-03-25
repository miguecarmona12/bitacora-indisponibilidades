# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package.json primero
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Argumento para VITE_API_URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Mostrar la URL durante el build (para debugging)
RUN echo "VITE_API_URL is: $VITE_API_URL"

# Exponer puerto
EXPOSE 5173

# Comando para desarrollo con host 0.0.0.0
CMD ["sh", "-c", "echo 'Starting Vite with API URL: $VITE_API_URL' && npm run dev -- --host 0.0.0.0"]