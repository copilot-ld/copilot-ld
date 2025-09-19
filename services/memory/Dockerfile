FROM copilot-ld/base:latest AS base
FROM base AS memory
COPY services/memory/ ./services/memory/
WORKDIR /app
RUN npm ci
WORKDIR /app/services/memory
EXPOSE 3000
CMD ["npm", "start"]
