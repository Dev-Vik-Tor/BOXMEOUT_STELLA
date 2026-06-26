# BOXMEOUT — Boxing Prediction Market on Stellar

A decentralized prediction market for boxing matches, built on Stellar with Soroban smart contracts.

## What It Is

BOXMEOUT lets users create boxing match markets, place XLM bets on fight outcomes, and claim winnings after results are confirmed on-chain. All funds are held in escrow by the smart contract — no centralized custody.

## Project Structure

```
boxmeout/
├── contracts/   Soroban smart contracts (Rust)
├── backend/     Indexer + REST API (Node.js / TypeScript)
├── frontend/    User interface (Next.js 14)
└── docs/        Architecture docs and contributor guide
```

## Smart Contracts

| Contract | Purpose |
|---|---|
| `MarketFactory` | Deploys and tracks all boxing market contracts |
| `Market` | Holds bets, manages pools, handles resolution and claims |
| `Treasury` | Collects protocol fees, admin-controlled withdrawals |

## Quick Start

### Prerequisites
- Rust + `cargo` with `soroban-cli`
- Node.js 20+
- PostgreSQL
- Redis
- Freighter wallet browser extension

### Contracts
```bash
cd contracts
cargo build --release
cargo test
```

### Backend
```bash
cd backend
cp .env.example .env   # fill in your Stellar + DB credentials
npm install
npm run db:migrate
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# open http://localhost:3000
```

## Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for coding standards, naming conventions, and how to pick and submit issues.

All functions are stubbed with `todo!()` (Rust) or `throw new Error("Not implemented")` (TypeScript). Pick a GitHub issue, implement the function, and open a PR.

## License

MIT
