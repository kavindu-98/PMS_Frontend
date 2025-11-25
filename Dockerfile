# Stage 1: Dependency installation stage
FROM node:21-alpine AS dependencies

# Env
ENV NODE_OPTIONS="--max_old_space_size=4096"

WORKDIR /app

# Copy package.json and lock file for deterministic builds
COPY package.json package-lock.json ./

# Set npm configs for better reliability
RUN npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set registry https://registry.npmjs.org

# Install dependencies with npm ci for reproducibility
RUN npm install

# Stage 2: Build stage
FROM dependencies AS builder
WORKDIR /app
COPY . .
RUN npm run build

# Stage 3: Production stage
FROM nginx:stable-alpine

WORKDIR /usr/share/nginx/html
COPY --from=builder /app/dist .
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

ENTRYPOINT ["nginx", "-g", "daemon off;"]