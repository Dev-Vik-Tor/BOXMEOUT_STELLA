# Architecture Overview

BOXMEOUT is a three-tier decentralized application:

```
┌────────────────────────────────────────────────────────────┐
│                         FRONTEND                           │
│              Next.js 14 — React — Tailwind                 │
│  Wallet (Freighter) ──► Soroban SDK ──► Stellar Network    │
└────────────────────────────┬───────────────────────────────┘
                             │ REST API
┌────────────────────────────▼───────────────────────────────┐
│                          BACKEND                           │
│              Node.js — Express — TypeScript                │
│   Indexer ──► PostgreSQL    Oracle Service ──► Admin UI    │
└────────────────────────────┬───────────────────────────────┘
                             │ Soroban RPC / Horizon
┌────────────────────────────▼───────────────────────────────┐
│                        STELLAR                             │
│         MarketFactory   Market(×N)   Treasury              │
│                    Soroban Contracts                       │
└────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Placing a Bet

```
User ──► clicks "Bet on Fighter A"
      ──► BettingInterface builds place_bet() XDR
      ──► Freighter prompts user to sign
      ──► Signed XDR submitted to Stellar network
      ──► Market contract escrowed XLM, BetPlaced event emitted
      ──► Indexer detects BetPlaced event
      ──► recordBet() + updateMarketPools() write to PostgreSQL
      ──► Frontend polls /api/markets/:id and shows updated odds
```

### Resolving a Fight

```
Fight ends
      ──► Oracle (admin or automated) submits result via POST /api/oracle/submit
      ──► OracleResult stored in DB (confirmed=false)
      ──► Admin reviews and calls POST /api/admin/markets/resolve
      ──► Backend builds resolve_market() Soroban transaction
      ──► Transaction signed with ADMIN_SECRET_KEY and submitted
      ──► MarketResolved event emitted on-chain
      ──► Indexer detects event → updateMarketStatus() in DB
      ──► Market status becomes Resolved — claims open
```

### Claiming Winnings

```
User ──► visits Portfolio page
      ──► sees winning bet with "Claim Winnings" button
      ──► ClaimButton builds claim_winnings() XDR
      ──► Freighter prompts user to sign
      ──► Soroban contract: marks bet claimed, transfers XLM payout
      ──► Protocol fee sent to Treasury contract
      ──► WinningsClaimed event emitted
      ──► Indexer detects event → markBetClaimed() in DB
      ──► Portfolio page shows updated claimed state
```

---

## Components and Responsibilities

### Contracts (`/contracts`)

- **MarketFactory** — single global registry. Holds ProtocolConfig. Deploys Market contracts.
- **Market** — one instance per fight. Self-contained escrow + betting logic. No cross-contract calls except to Treasury for fees.
- **Treasury** — passive fee collector. Receives deposits from Market contracts on each claim.

Contracts are stateless from each other's perspective — Markets do not call other Markets.

### Backend (`/backend`)

- **Indexer** (`src/indexer/`) — long-running process. Polls Soroban RPC for new ledgers. Routes events to service handlers. Writes to PostgreSQL. Resumable from last ledger on restart.
- **Services** (`src/services/`) — pure business logic layer. No HTTP knowledge. Each service owns one domain: markets, bets, oracle, indexing.
- **Controllers** (`src/api/controllers/`) — thin HTTP handlers. Parse request, call service, return response. No logic here.
- **Oracle** (`src/oracle/`) — optional automated oracle. Queries external fight data APIs. Submits result suggestions to admin review queue.

### Frontend (`/frontend`)

- **`app/`** — Next.js App Router pages. Server components fetch initial data. Client components handle wallet interaction.
- **`components/`** — Presentational React components. Receive data via props. No direct API calls.
- **`hooks/`** — Data-fetching and wallet hooks. All API calls go through hooks, not components.
- **`lib/api.ts`** — Typed fetch wrappers for every backend endpoint.
- **`lib/stellar.ts`** — Soroban transaction building, XDR encoding, address utilities.

---

## Technology Choices

| Layer | Technology | Why |
|---|---|---|
| Smart contracts | Rust + Soroban SDK | Native Stellar contract runtime |
| Blockchain | Stellar | Low fees, fast finality (~5s), XLM as native payment token |
| Backend runtime | Node.js + TypeScript | Large ecosystem for Stellar SDK, fast iteration |
| Database | PostgreSQL + Prisma | Relational queries for portfolio aggregates, strong types |
| Job queue | BullMQ + Redis | Reliable background processing for indexer recovery jobs |
| Frontend | Next.js 14 | Server components for fast initial load, App Router for layouts |
| Styling | Tailwind CSS | Utility-first, no runtime CSS |
| Charts | Recharts | React-native, composable |
| Wallet | Freighter API | Most widely used Stellar browser wallet |

---

## Security Model

- **Funds custody:** XLM is held by individual Market contracts — not a shared pool. A bug in one market cannot drain other markets.
- **Oracle trust:** The oracle address is set per-market at creation. Admin can rotate it before resolution. Multi-sig oracle recommended for mainnet.
- **Dispute window:** After resolution, bettors have `dispute_window_sec` seconds to raise a dispute before claims open. Admin (ideally a DAO multisig) makes the final call.
- **Re-entrancy:** claim functions mark bets as claimed before transferring XLM (checks-effects-interactions pattern).
- **Admin keys:** `ADMIN_SECRET_KEY` in the backend is used only for on-chain resolution calls. It should be a dedicated low-balance account with only the permissions it needs.
- **Protocol pause:** Admin can pause the entire protocol to halt new markets and bets in an emergency.

---

## Scalability Notes

- Each fight is its own contract instance — no global state contention between markets.
- The indexer is the primary scaling bottleneck. BullMQ queue between the event processor and DB writers handles burst event loads.
- Pool reads (odds, payout estimates) are cached in Redis with a 5-second TTL, invalidated on every BetPlaced event.
- For very high-volume markets, consider a Merkle-proof claim pattern to avoid per-bettor on-chain enumeration.
