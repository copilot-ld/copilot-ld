FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/ ./packages/
COPY proto/ ./proto/

COPY extensions/web/package.json ./extensions/web/
COPY extensions/web/ ./extensions/web/

RUN npm ci --workspace=@copilot-ld/web --include-workspace-root

WORKDIR /app/extensions/web

EXPOSE 3000
CMD ["npm", "start"]
