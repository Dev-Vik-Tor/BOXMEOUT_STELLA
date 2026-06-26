# Backend API Reference

Base URL (local): `http://localhost:3001`

All responses are JSON. All amounts are serialized as strings to preserve BigInt precision.

---

## Authentication

Public endpoints require no authentication.
Admin endpoints require the `Authorization: Bearer <ADMIN_API_KEY>` header.
Oracle submit endpoint requires `Authorization: Bearer <ORACLE_API_KEY>`.

---

## Markets

### `GET /api/markets`

Returns a paginated list of boxing markets.

**Query params**
| Param | Type | Description |
|---|---|---|
| `status` | string | Filter by `Open`, `Locked`, `Resolved`, `Cancelled`, `Disputed` |
| `weightClass` | string | Filter by fighter weight class |
| `page` | number | Page number (default 1) |
| `limit` | number | Results per page (default 20, max 100) |

**Response `200`**
```json
[
  {
    "id": "abc123",
    "contractAddress": "CABC...",
    "fighterA": { "name": "Canelo Alvarez", "record": "60-2-2", "nationality": "Mexico", "weightClass": "Super Middleweight" },
    "fighterB": { "name": "David Benavidez", "record": "29-0-0", "nationality": "USA", "weightClass": "Super Middleweight" },
    "scheduledAt": "2026-09-15T22:00:00Z",
    "bettingEndsAt": "2026-09-15T21:00:00Z",
    "status": "Open",
    "outcome": null,
    "poolA": "500000000",
    "poolB": "300000000",
    "totalPool": "800000000",
    "oracleAddress": "GABC...",
    "createdBy": "GABC..."
  }
]
```

---

### `GET /api/markets/:id`

Returns full detail for a single market.

**Response `200`** — same shape as one item above.
**Response `404`** — `{ "error": "Market not found" }`

---

### `GET /api/markets/:id/stats`

Returns aggregate stats for a market.

**Response `200`**
```json
{
  "totalBets": 142,
  "uniqueBettors": 89,
  "poolA": "500000000",
  "poolB": "300000000",
  "totalVolume": "800000000",
  "impliedOddsA": 62.5,
  "impliedOddsB": 37.5
}
```

---

### `GET /api/markets/:id/bets`

Returns all bets placed on a market.

**Query params:** `page`, `limit`

**Response `200`**
```json
[
  {
    "id": "bet_xyz",
    "marketId": "abc123",
    "bettor": "GABC...",
    "side": "FighterA",
    "amount": "10000000",
    "placedAt": "2026-09-10T14:00:00Z",
    "claimed": false,
    "payout": null
  }
]
```

---

### `GET /api/markets/:id/odds-history`

Returns historical odds snapshots for the market chart.

**Response `200`**
```json
[
  {
    "timestamp": "2026-09-10T14:00:00Z",
    "poolA": "100000000",
    "poolB": "50000000",
    "oddsA": 66.7,
    "oddsB": 33.3
  }
]
```

---

## Bets

### `GET /api/bets/:address`

Returns all bets for a Stellar wallet address.

**Query params**
| Param | Type | Description |
|---|---|---|
| `status` | string | `pending`, `won`, `lost`, `claimed` |
| `marketId` | string | Filter to a specific market |
| `page`, `limit` | number | Pagination |

**Response `200`** — array of Bet objects (same shape as above).

---

### `GET /api/bets/:address/portfolio`

Returns portfolio summary for a wallet.

**Response `200`**
```json
{
  "totalStaked": "1500000000",
  "totalWinnings": "2100000000",
  "pendingClaims": "350000000",
  "activeBets": 3,
  "completedBets": 12,
  "roi": 40.0
}
```

---

### `GET /api/bets/payout-estimate`

Returns estimated payout for a hypothetical bet. Does not place a real bet.

**Query params**
| Param | Type | Required | Description |
|---|---|---|---|
| `market_id` | string | yes | Target market |
| `side` | `FighterA` \| `FighterB` | yes | Side to bet on |
| `amount` | string (stroops) | yes | Stake amount |

**Response `200`**
```json
{ "estimate": "18600000" }
```

**Response `400`** — `{ "error": "amount below minimum bet" }`

---

## Oracle (authorized)

### `POST /api/oracle/submit`

Submit a fight result. Requires `Authorization: Bearer <ORACLE_API_KEY>`.

**Body**
```json
{
  "market_id": "abc123",
  "outcome": "FighterA",
  "source": "BoxRec"
}
```

**Response `201`**
```json
{
  "id": "uuid",
  "marketId": "abc123",
  "outcome": "FighterA",
  "source": "BoxRec",
  "reportedBy": "GABC...",
  "reportedAt": "2026-09-16T01:00:00Z",
  "confirmed": false
}
```

---

### `GET /api/oracle/results` (admin)

Lists all oracle submissions.

**Response `200`** — array of OracleResult objects.

---

## Admin (protected)

### `POST /api/admin/markets/resolve`

Confirms an oracle result and triggers on-chain resolution.

**Body**
```json
{
  "oracle_result_id": "uuid"
}
```

**Response `200`** — `{ "status": "ok" }`

---

### `POST /api/admin/markets/dispute/resolve`

Resolves a disputed market with an admin override outcome.

**Body**
```json
{
  "dispute_id": "uuid",
  "override_outcome": "FighterB"
}
```

**Response `200`** — `{ "status": "ok" }`

---

### `GET /api/admin/markets/pending`

Returns all markets in `Locked` status without a confirmed oracle result.

**Response `200`** — array of Market objects.

---

## Health

### `GET /health`

**Response `200`**
```json
{ "status": "ok", "db": "connected" }
```

---

## Error Format

All errors follow this shape:

```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE"
}
```

Common codes: `NOT_FOUND`, `UNAUTHORIZED`, `VALIDATION_ERROR`, `RATE_LIMITED`, `INTERNAL_ERROR`
