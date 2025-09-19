FROM copilot-ld/base:latest AS base
FROM base AS hash
COPY tools/hash/ ./services/hash/
WORKDIR /app
RUN npm ci
WORKDIR /app/services/hash
EXPOSE 3000
CMD ["npm", "start"]
