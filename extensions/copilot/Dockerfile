FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/ ./packages/
COPY proto/ ./proto/

COPY extensions/copilot/package.json ./extensions/copilot/
COPY extensions/copilot/ ./extensions/copilot/

RUN npm ci --workspace=@copilot-ld/copilot --include-workspace-root

WORKDIR /app/extensions/copilot

EXPOSE 3000
CMD ["npm", "start"]
