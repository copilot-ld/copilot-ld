FROM node:22-alpine

COPY extensions/web/ /app/

WORKDIR /app
RUN --mount=type=secret,id=github_token \
    GITHUB_TOKEN=$(cat /run/secrets/github_token) npm install --omit=dev
RUN --mount=type=secret,id=github_token \
    GITHUB_TOKEN=$(cat /run/secrets/github_token) npx @copilot-ld/libutil codegen --target=/app/generated

EXPOSE 3000
CMD ["npm", "start"]