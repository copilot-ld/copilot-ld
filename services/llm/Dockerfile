FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/ ./packages/
COPY proto/ ./proto/

COPY services/llm/package.json ./services/llm/
COPY services/llm/ ./services/llm/

RUN npm ci --workspace=@copilot-ld/llm --include-workspace-root

WORKDIR /app/services/llm

EXPOSE 3000
CMD ["npm", "start"]
