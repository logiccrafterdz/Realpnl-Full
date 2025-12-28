# RealPNL 🔍

**Privacy-first crypto trade analyzer** — A Telegram Mini App + Bot that helps you track, analyze, and audit your real trading performance.

> 🔒 **Your data never leaves your device.** All calculations happen client-side.

## Features

- 📊 **CSV Trade Import** — Upload your trade history and see real performance
- 📈 **Net P&L Calculation** — Actual profit/loss after all fees
- 🔄 **HODL Comparison** — What if you just bought and held?
- 💸 **Fee Leak Detection** — Total cost of trading (fees + slippage + gas)
- 📉 **Win Rate & Drawdown** — Key trading metrics
- 🔒 **Encrypted Export** — AES-256 encrypted `.realpnl` backup files
- ✅ **Bot Verification** — Check if trading bots/channels are active

---

## Quick Start

### Prerequisites

- Node.js 18+ (for Mini App)
- Python 3.10+ (for Bot)
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/realpnl.git
cd realpnl
```

### 2. Setup Mini App (Frontend)

```bash
cd mini-app
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

### 3. Setup Telegram Bot

```bash
cd bot
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your BOT_TOKEN and MINI_APP_URL
```

Run the bot:
```bash
python main.py
```

---

## Deployment

### Mini App → GitHub Pages

1. Build the Mini App:
   ```bash
   cd mini-app
   npm run build
   ```

2. Push the `dist` folder to your GitHub Pages branch, or use GitHub Actions.

3. Enable GitHub Pages in repository settings.

4. Update `MINI_APP_URL` in your bot's `.env` file.

### Bot → Fly.io / Render

#### Fly.io:

```bash
cd bot
fly launch
fly secrets set BOT_TOKEN=your_token MINI_APP_URL=https://yourusername.github.io/realpnl/
fly deploy
```

#### Render:

1. Create a new Web Service on Render
2. Connect your repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `python main.py`
5. Add environment variables: `BOT_TOKEN`, `MINI_APP_URL`

---

## CSV Format

Your trade history CSV should have these columns:

| Column | Required | Description |
|--------|----------|-------------|
| `date` | ✅ | Trade timestamp (YYYY-MM-DD HH:MM:SS) |
| `symbol` | ✅ | Token symbol (BTC, ETH, PEPE, etc.) |
| `action` | ✅ | `buy` or `sell` |
| `price` | ✅ | Price in USD |
| `amount` | ✅ | Quantity traded |
| `fee_usd` | ❌ | Fee in USD (estimated if missing) |

### Example:

```csv
date,symbol,action,price,amount,fee_usd
2025-04-01 12:30:45,PEPE,buy,0.0000082,10000000,2.50
2025-04-05 09:15:22,PEPE,sell,0.0000095,10000000,2.75
```

---

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message with main menu |
| `/upload` | Open the Mini App to upload trades |
| `/verify @username` | Check if a bot/channel is active |
| `/report` | Open your saved report |
| `/help` | Show help information |

---

## Self-Test Scenarios

Before deploying, verify all these scenarios work correctly:

| # | Scenario | Test Input | Expected Result |
|---|----------|------------|-----------------|
| 1 | Empty CSV | Upload empty file | Error: "No trades found" |
| 2 | Mismatched buys/sells | 2 buys, 1 sell for same token | Warning: "1 open position(s)" |
| 3 | Future-dated trade | Date > today | Error: "Trade date in future" |
| 4 | Unknown symbol | Use `FAKECOIN` | Warning: "Price assumed $1" |
| 5 | Case normalization | Use `BUY` (uppercase) | Parses correctly as `buy` |
| 6 | Large CSV | 10,000 rows | Processes in < 2 seconds |
| 7 | Private channel | `/verify @private_channel` | Error: "Cannot verify private" |
| 8 | Slippage change | Change to 10% | Fee Leak recalculates instantly |

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────┐
│                  USER'S DEVICE                       │
│  ┌───────────────────────────────────────────────┐  │
│  │          Mini App (Browser/Telegram)          │  │
│  │  • CSV parsing (PapaParse)                    │  │
│  │  • PnL calculations (JavaScript)              │  │
│  │  • AES-256 encryption (crypto-js)             │  │
│  │  • localStorage for persistence               │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                          │
                          │ HTTPS (public APIs only)
                          ▼
    ┌────────────────────────────────────┐
    │  CoinGecko API (price data)        │
    └────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              TELEGRAM BOT SERVER                     │
│  • /verify command (public channel metadata)        │
│  • Mini App launcher                                │
│  • NO trade data storage                            │
└─────────────────────────────────────────────────────┘
```

**Privacy Guarantees:**
- ✅ All trade data is processed client-side
- ✅ No trade data is sent to any server
- ✅ Bot only accesses public channel metadata
- ✅ Exported reports are AES-256 encrypted locally

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18 + Vite |
| Styling | Vanilla CSS (dark theme) |
| CSV Parsing | PapaParse |
| Encryption | crypto-js (AES-256) |
| Bot | Python + aiogram 3 |
| Price API | CoinGecko (free tier) |

---

## Key Calculations

| Metric | Formula |
|--------|---------|
| **Net PnL** | `Σ(sell × price) − Σ(buy × price) − fees` |
| **HODL Return** | `(final_price / first_price − 1) × invested` |
| **Fee Leak** | `fees + (trade_value × slippage%) + (trades × gas_fee)` |
| **Win Rate** | `profitable_trades / total_closed_trades × 100` |
| **Max Drawdown** | `(peak − trough) / peak × 100` |

---

## License

MIT License — See [LICENSE](LICENSE) for details.

---

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---
