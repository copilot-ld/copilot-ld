FROM copilot-ld/base:latest AS base
FROM base AS llm
COPY services/llm/ ./services/llm/
WORKDIR /app
RUN npm ci
WORKDIR /app/services/llm
EXPOSE 3000
CMD ["npm", "start"]
