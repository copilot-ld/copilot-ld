FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY packages ./packages

# Copy the specific target directory (service or extension)
ARG TARGET_PATH
COPY ${TARGET_PATH} ./${TARGET_PATH}

# Install dependencies only for the specific workspace
RUN --mount=type=secret,id=github_token \
    GITHUB_TOKEN=$(cat /run/secrets/github_token) \
    npm install --workspace=${TARGET_PATH} --omit=dev --ignore-scripts

FROM gcr.io/distroless/nodejs22-debian12

WORKDIR /app

# Copy workspace structure
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

# Copy the built target
ARG TARGET_PATH
COPY --from=builder /app/${TARGET_PATH} ./${TARGET_PATH}

# Set working directory to the target service
WORKDIR /app/${TARGET_PATH}

EXPOSE 3000

# We use the root node_modules binary, so we need to adjust the path
CMD ["../../node_modules/.bin/download", "--", "/nodejs/bin/node", "server.js"]
