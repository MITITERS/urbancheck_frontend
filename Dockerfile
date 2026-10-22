# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# deps: install once, reused by the dev and build stages.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
# dev: Vite dev server with hot reload. Used by docker-compose.yml.
# The source is bind-mounted at runtime, so nothing is copied here.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS dev
WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ---------------------------------------------------------------------------
# build: type-check and produce the static bundle.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
# runtime: the bundle served by nginx, which also proxies the API so the
# browser only ever talks to one origin.
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime
ENV API_UPSTREAM=http://django:8000
COPY compose/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY compose/nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
