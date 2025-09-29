FROM node:22-alpine

COPY tools/hash/ /app/

ARG GITHUB_TOKEN
ENV GITHUB_TOKEN=$GITHUB_TOKEN

WORKDIR /app/

RUN --mount=type=secret,id=github_token \
    GITHUB_TOKEN=$(cat /run/secrets/github_token) \
    npm install --omit=dev

RUN --mount=type=secret,id=github_token \
    GITHUB_TOKEN=$(cat /run/secrets/github_token) \
    npx codegen --source=/app/generated

EXPOSE 3000
CMD ["npm", "run", "docker"]
