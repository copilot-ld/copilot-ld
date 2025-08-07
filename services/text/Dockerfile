FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/ ./packages/
COPY proto/ ./proto/

COPY services/text/package.json ./services/text/
COPY services/text/ ./services/text/

RUN npm ci --workspace=@copilot-ld/text --include-workspace-root

WORKDIR /app/services/text

EXPOSE 3000
CMD ["npm", "start"]
