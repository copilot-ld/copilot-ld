FROM copilot-ld/base:latest AS base
FROM base AS vector
COPY services/vector/ ./services/vector/
WORKDIR /app
RUN npm ci
WORKDIR /app/services/vector
EXPOSE 3000
CMD ["npm", "start"]
