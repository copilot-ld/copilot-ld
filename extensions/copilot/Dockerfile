FROM copilot-ld/base:latest AS base
FROM base AS copilot
COPY extensions/copilot/ ./extensions/copilot/
WORKDIR /app
RUN npm ci
WORKDIR /app/extensions/copilot
EXPOSE 3000
CMD ["npm", "start"]
