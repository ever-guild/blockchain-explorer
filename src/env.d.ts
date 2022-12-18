interface Environment {
  TESTNET: string
  ADDRBOOK_LOCATION: string
  COINGECKO_ENDPOINT: string
  LITE_API_ENDPOINT: string
  NFT_API_ENDPOINT: string
  PROXY_ENDPOINT: string
}

declare global {
  const env: Environment;
}

export {};
