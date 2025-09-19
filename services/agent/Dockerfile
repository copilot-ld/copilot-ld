FROM copilot-ld/base:latest AS base
FROM base AS agent
COPY services/agent/ ./services/agent/
WORKDIR /app
RUN npm ci
WORKDIR /app/services/agent
EXPOSE 3000
CMD ["npm", "start"]
