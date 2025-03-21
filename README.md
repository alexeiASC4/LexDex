# LexDex

A decentralized exchange (dex) for trading cryptocurrencies on Ethereum and Base. For demo purposes, not optimized for production use. Forked from this [repo](https://github.com/IAmJaysWay/dexStarter), initially followed this [tutorial](https://www.youtube.com/watch?v=t8U7GRrlYW8).

## Demo
![Demo](docs/LexDex.gif)

GIF created with [LiceCap](http://www.cockos.com/licecap/).

## Implemented From Tutorial

- [x] Fetching token prices using [Moralis API](https://developers.moralis.com/)
- [x] Automatically shows the amount of buy token you can receive when user inputs sell token amount
- [x] Several different cryptocurrencies options (limited list)
- [x] Connection to MetaMask wallet
- [x] User can change slippage tolerance
- [x] Switch arrow to switch input token

## Custom Changes/Additions
- [x] Base network support
- [x] User can switch between Ethereum and Base
- [x] Use [0x Swap API](https://0x.org/products/swap) to facilitate swapping
- [x] User shown their token balances for the selected tokens upon wallet connection
- [x] Deployed backend server using [Render](https://render.com/)
- [x] small UI changes

## Ideas for Further Development
- Full token support for both Ethereum and Base
- Extensive wallet support (i.e Wallet Connect)
- Show fiat currency value equivalent underneath token amounts
- User can choose their preferred fiat currency for fiat currency value
- Use Wagmi's prepare send hooks for faster UI swap experience
- Custom gas slippage
