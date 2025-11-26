# frontend/Dockerfile (con etapas de DEV y PROD, usando pnpm)

# --- 1. Etapa Base ---
# Instala las dependencias que comparten ambas etapas
FROM node:20-alpine AS base
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml .

RUN pnpm install

# --- 2. Etapa de Desarrollo (dev) ---
# La que usaremos en el hackathon.
FROM base AS dev
COPY . .
EXPOSE 5173
CMD ["pnpm", "run", "dev", "--", "--host"]


# --- 3. Etapa de Compilación (builder) ---
# Se usa solo para crear la versión de producción
FROM base AS builder
COPY . .
RUN pnpm run build

# --- 4. Etapa de Producción (prod) ---
# El servidor web final y ligero
FROM nginx:1.21-alpine AS prod
EXPOSE 80
# Vite compila en la carpeta 'dist', no 'build'
COPY --from=builder /app/dist /usr/share/nginx/html
# (Opcional: Añadir un nginx.conf para el router de React)
CMD ["nginx", "-g", "daemon off;"]