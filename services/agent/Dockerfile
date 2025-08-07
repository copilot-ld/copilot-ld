FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/ ./packages/
COPY proto/ ./proto/

COPY services/agent/package.json ./services/agent/
COPY services/agent/ ./services/agent/

RUN npm ci --workspace=@copilot-ld/agent --include-workspace-root

WORKDIR /app/services/agent

EXPOSE 3000
CMD ["npm", "start"]
