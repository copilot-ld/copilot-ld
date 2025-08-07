FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/ ./packages/
COPY proto/ ./proto/

COPY services/history/package.json ./services/history/
COPY services/history/ ./services/history/

RUN npm ci --workspace=@copilot-ld/history --include-workspace-root

WORKDIR /app/services/history

EXPOSE 3000
CMD ["npm", "start"]
