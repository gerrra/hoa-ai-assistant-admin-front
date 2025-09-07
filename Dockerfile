# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

# ставим dev-зависимости всегда (vite и т.д.)
ENV NPM_CONFIG_PRODUCTION=false

# пробрасываем base URL для Vite (если используешь)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# зависимости
COPY package*.json ./
RUN npm ci --include=dev

# исходники и сборка
COPY . .
RUN npm run build

# ---------- Runtime stage ----------
FROM nginx:1.27-alpine

# кладём статик
COPY --from=build /app/dist /usr/share/nginx/html

# кладём наш конфиг (без всяких printf, чтобы $ не экранировались)
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# на всякий случай отключим шаблоны envsubst, чтобы ничего не переписало конфиг
RUN rm -f /docker-entrypoint.d/20-envsubst-on-templates.sh && rm -rf /etc/nginx/templates || true

EXPOSE 80
