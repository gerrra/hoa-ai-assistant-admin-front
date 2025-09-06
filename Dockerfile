# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Включаем установку devDeps вне зависимости от NODE_ENV
ENV NPM_CONFIG_PRODUCTION=false

# Опциональные build-арги для Vite (если есть)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Устанавливаем зависимости
COPY package*.json ./
RUN npm ci --include=dev

# Копируем исходники
COPY . .

# Сборка
RUN npm run build

# Runtime stage
FROM nginx:1.27-alpine
# Кладём статик в nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Простой дефолтный конфиг SPA (SPA роутинг на index.html)
RUN printf 'server { \
  listen 80; \
  server_name _; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { try_files $$uri /index.html; } \
}\n' > /etc/nginx/conf.d/default.conf