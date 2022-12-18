# Blockchain Explorer

## Use

```shell
docker run --env PROXY_ENDPOINT=wss://ws.tonlens.com \
 --publish 127.0.0.1:3000:3000/tcp \
 ghcr.io/everscaleguild/blockchain-explorer
open http://localhost:3000
```

## Develop

```shell
yarn install
yarn dev
```
