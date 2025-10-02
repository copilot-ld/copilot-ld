ARG COMPONENT_PATH
FROM node:22-alpine AS builder

WORKDIR /app/
COPY ${COMPONENT_PATH} ./

RUN --mount=type=secret,id=github_token \
    GITHUB_TOKEN=$(cat /run/secrets/github_token) \
    npm install

RUN --mount=type=secret,id=github_token \
    GITHUB_TOKEN=$(cat /run/secrets/github_token) \
    npm install @copilot-ld/libcodegen

RUN npx codegen --source=/app/generated

FROM node:22-alpine AS production

WORKDIR /app/
COPY ${COMPONENT_PATH} ./

RUN --mount=type=secret,id=github_token \
    GITHUB_TOKEN=$(cat /run/secrets/github_token) \
    npm install --omit=dev --omit=optional

COPY --from=builder /app/generated ./generated

EXPOSE 3000
CMD ["npm", "run", "docker"]