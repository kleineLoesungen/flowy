# Multi-stage Dockerfile for building and running the Nuxt 4 app
# Runtime environment variables must be provided at container runtime (e.g. with `-e VAR=value` or docker-compose).

############################
# Builder
############################
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies (including dev deps needed for build)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Remove dev dependencies to make the final image smaller
RUN npm prune --production || true

############################
# Runtime image
############################
FROM node:20-alpine AS runner
WORKDIR /app

# Create a non-root user
RUN addgroup -S app && adduser -S app -G app

# Copy built output and production node_modules from builder
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Set ownership to non-root user
RUN chown -R app:app /app

USER app

# Expose default port (override at runtime by setting PORT env)
EXPOSE 3000

# NOTE: Do NOT bake runtime secrets or configuration into the image.
# Pass env vars at runtime: `docker run -e DATABASE_URL=... -e SMTP_HOST=... -p 3000:3000 your-image`

# Start the built Nitro server
CMD ["node", ".output/server/index.mjs"]
