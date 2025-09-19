FROM copilot-ld/base:latest AS base
FROM base AS tool
COPY services/tool/ ./services/tool/
WORKDIR /app
RUN npm ci
WORKDIR /app/services/tool
EXPOSE 3000
CMD ["npm", "start"]