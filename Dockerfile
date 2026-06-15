# Stage 1: Build
FROM oven/bun:1-alpine AS builder
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
WORKDIR /app

COPY package.json bun.lock* bunfig.toml* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Stage 2: nginx + Bun SSR cùng container
FROM oven/bun:1-alpine
RUN apk add --no-cache nginx

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Nginx config: serve static assets, proxy SSR
RUN mkdir -p /etc/nginx/http.d && \
    printf 'server {\n\
    listen 3000;\n\
\n\
    # Serve static assets directly\n\
    location /assets/ {\n\
        root /app/dist/client;\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
        try_files $uri =404;\n\
    }\n\
\n\
    location /favicon.png {\n\
        root /app/dist/client;\n\
        try_files $uri =404;\n\
    }\n\
\n\
    # SSR requests to Bun\n\
    location / {\n\
        proxy_pass http://127.0.0.1:3001;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
    }\n\
}\n' > /etc/nginx/http.d/default.conf

# Startup: Bun SSR trên port 3001, nginx trên port 3000
RUN printf '#!/bin/sh\n\
PORT=3001 bun run /app/dist/server/server.js &\n\
exec nginx -g "daemon off;"\n' > /start.sh && chmod +x /start.sh

EXPOSE 3000
CMD ["/start.sh"]
