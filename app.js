const express = require('express')
const app = express()
const path = require('path')
const port = process.env.PORT || 3000

app.get('/env.js', (req, res) => {
  res.setHeader('content-type', 'application/javascript')
  res.send(`const env = {
    TESTNET: '${process.env.TESTNET || ''}',
    ADDRBOOK_LOCATION: '${process.env.ADDRBOOK_LOCATION || ''}',
    COINGECKO_ENDPOINT: '${process.env.COINGECKO_ENDPOINT || ''}',
    LITE_API_ENDPOINT: '${process.env.LITE_API_ENDPOINT || ''}',
    NFT_API_ENDPOINT: '${process.env.NFT_API_ENDPOINT || ''}',
    PROXY_ENDPOINT: '${process.env.PROXY_ENDPOINT || ''}',
  }`)
})

app.use(express.static('dist'))
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'))
})

app.listen(port, (err) => {
  if (err) return console.log(err)
  console.log(`Server running on port ${port}`)
})
