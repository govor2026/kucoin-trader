---
name: kucoin-trader
description: Professional KuCoin (KC) trading system - multi-account support, spot/margin/futures trading, asset transfers. Use to check balances, transfer assets, open/close positions, and manage your KuCoin portfolio.
metadata: {"openclaw":{"emoji":"🟢","always":true,"requires":{"bins":["node"]}}}
---

# KuCoin Trader 🟢

Professional automated trading system for KuCoin (KC) - a global cryptocurrency exchange.

## 🚀 Quick Start

### Setup Credentials

Save to `~/.openclaw/credentials/kucoin.json`:
```json
{
  "apiKey": "YOUR_API_KEY",
  "secretKey": "YOUR_SECRET_KEY",
  "passphrase": "YOUR_PASSPHRASE"
}
```

### Environment Variables (alternative)
```bash
export KUCOIN_API_KEY="your_api_key"
export KUCOIN_SECRET_KEY="your_secret_key"
export KUCOIN_PASSPHRASE="your_passphrase"
export KUCOIN_IS_SANDBOX="true"  # for sandbox testing
```

## 📊 Basic Queries

### Check All Account Balances
```bash
node workspace/skills/kucoin-trader/scripts/accounts.js
```

### Get Current Price
```bash
node workspace/skills/kucoin-trader/scripts/market.js --symbol BTC-USDT
```

### Get Trading Report
```bash
node workspace/skills/kucoin-trader/scripts/report.js
```

## 💰 Asset Transfer

### Transfer from Main (Funding) to Trade (Spot)
```bash
node workspace/skills/kucoin-trader/scripts/transfer.js --from main --to trade --currency USDT --amount 100
```

### Transfer from Trade to Futures
```bash
node workspace/skills/kucoin-trader/scripts/transfer.js --from trade --to futures --currency USDT --amount 100
```

### Transfer from Futures to Main
```bash
node workspace/skills/kucoin-trader/scripts/transfer.js --from futures --to main --currency USDT --amount 100
```

### Transfer between any accounts
```bash
# Supported types: main, trade, margin, isolated, futures
node workspace/skills/kucoin-trader/scripts/transfer.js --from <FROM> --to <TO> --currency <CURRENCY> --amount <AMOUNT>
```

### Supported Account Types
| Type | Description |
|------|-------------|
| `main` | Funding Account - primary asset storage |
| `trade` | Spot Trading Account - for trading |
| `margin` | Cross Margin Account - leveraged trading |
| `isolated` | Isolated Margin Account |
| `futures` | Futures Account - perpetual contracts |

## ⚡ Spot Trading

### Buy (Market Order)
```bash
node workspace/skills/kucoin-trader/scripts/trade.js --symbol BTC-USDT --side buy --type market --size 0.001
```

### Buy (Limit Order)
```bash
node workspace/skills/kucoin-trader/scripts/trade.js --symbol ETH-USDT --side buy --type limit --price 2500 --size 0.1
```

### Sell (Market Order)
```bash
node workspace/skills/kucoin-trader/scripts/trade.js --symbol BTC-USDT --side sell --type market --size 0.001
```

### Sell (Limit Order)
```bash
node workspace/skills/kucoin-trader/scripts/trade.js --symbol ETH-USDT --side sell --type limit --price 3000 --size 0.1
```

## 🏦 Margin Trading (Cross Margin)

### Borrow from Margin Account
```bash
# 查看可借额度
node workspace/skills/kucoin-trader/scripts/margin.js borrowable --currency USDT

# 借款
node workspace/skills/kucoin-trader/scripts/margin.js borrow --currency USDT --amount 100
```

### Repay Margin Loan
```bash
node workspace/skills/kucoin-trader/scripts/margin.js repay --currency USDT --amount 50
```

### Margin Trade (with leverage)
```bash
# 全仓杠杆买入 (5x杠杆)
node workspace/skills/kucoin-trader/scripts/margin.js trade --symbol BTC-USDT --side buy --size 0.01 --leverage 5

# 全仓杠杆卖出
node workspace/skills/kucoin-trader/scripts/margin.js trade --symbol ETH-USDT --side sell --size 0.1 --leverage 3
```

## 🏝️ Isolated Margin Trading

### Isolated Margin Trade
```bash
# 逐仓杠杆买入 (3x杠杆)
node workspace/skills/kucoin-trader/scripts/isolated.js trade --symbol BTC-USDT --side buy --size 0.01 --leverage 3

# 逐仓杠杆卖出
node workspace/skills/kucoin-trader/scripts/isolated.js trade --symbol ETH-USDT --side sell --size 0.1 --leverage 5
```

### Check Isolated Borrow/Repay
```bash
node workspace/skills/kucoin-trader/scripts/isolated.js borrow --symbol BTC-USDT --amount 0.01
node workspace/skills/kucoin-trader/scripts/isolated.js repay --symbol BTC-USDT --amount 0.01
```

## 📊 Futures Trading

### Futures Buy (Long)
```bash
node workspace/skills/kucoin-trader/scripts/futures.js trade --symbol BTC-USDT --side buy --size 0.001 --leverage 10
```

### Futures Sell (Short)
```bash
node workspace/skills/kucoin-trader/scripts/futures.js trade --symbol BTC-USDT --side sell --size 0.001 --leverage 10
```

### Set Futures Leverage
```bash
node workspace/skills/kucoin-trader/scripts/futures.js leverage --symbol BTC-USDT --leverage 20
```

## 📈 Supported Trading Pairs

| Pair | Description |
|------|-------------|
| BTC-USDT | Bitcoin |
| ETH-USDT | Ethereum |
| SOL-USDT | Solana |
| XRP-USDT | XRP |
| DOGE-USDT | Dogecoin |
| ADA-USDT | Cardano |
| AVAX-USDT | Avalanche |
| KCS-USDT | KuCoin Token |

## 🏦 Account Types

| Type | Description |
|------|-------------|
| `main` | Funding Account - primary asset storage |
| `trade` | Spot Trading Account - for trading |
| `margin` | Cross Margin Account - leveraged trading (up to 5x) |
| `isolated` | Isolated Margin Account |
| `futures` | Futures Account - perpetual contracts |

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `accounts.js` | List all account balances |
| `transfer.js` | Transfer between accounts |
| `trade.js` | Execute spot trades |
| `margin.js` | Cross margin trading (borrow/repay/trade) |
| `isolated.js` | Isolated margin trading |
| `futures.js` | Futures trading |
| `market.js` | Get market ticker data |
| `report.js` | Generate trading report |

## ⚠️ Safety Rules

1. **ALWAYS** verify position before closing
2. **ALWAYS** set Stop Loss on leveraged trades
3. **NEVER** use leverage higher than 10x without experience
4. **VERIFY** pair and quantity before executing
5. **CONFIRM** with user before executing large orders

## 🔗 Links

- [API Documentation](https://docs.kucoin.com/)
- [Create Account](https://www.kucoin.com/)
- [Sandbox](https://sandbox.kucoin.com/)

---
*Skill for KuCoin trading with multi-account support*
