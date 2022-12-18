FROM node:18 AS builder

WORKDIR /src

COPY . .

RUN yarn install
RUN yarn build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /src/dist /app/dist
COPY --from=builder /src/app.js /app/app.js
COPY --from=builder /src/package.json /src/yarn.lock /app/
RUN yarn install --production

EXPOSE 3000

CMD [ "npm", "start"]
