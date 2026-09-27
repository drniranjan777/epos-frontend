# ---- Build ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_APP_NAME="JCB Parts Inventory"
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_APP_NAME=$VITE_APP_NAME
RUN npm run build

# ---- Serve ----
FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
