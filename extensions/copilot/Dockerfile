FROM node:22-alpine

COPY extensions/copilot/ /app/

ARG GITHUB_TOKEN
ENV GITHUB_TOKEN=$GITHUB_TOKEN

WORKDIR /app
RUN npm install --omit=dev
RUN npx @copilot-ld/libutil codegen --target=/app/generated

EXPOSE 3000
CMD ["npm", "start"]