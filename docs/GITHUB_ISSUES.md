# BOXMEOUT — GitHub Issues

120 issues ready to be created on GitHub.
40 for `/contracts` · 40 for `/backend` · 40 for `/frontend`

To create these on GitHub use the GitHub CLI:
```bash
gh issue create --title "..." --body "..." --label "..."
```

---

## CONTRACTS ISSUES (1–40)

---

### Issue #1
**Title:** `[contracts] Implement initialize() in MarketFactory`
**Labels:** `good first issue` `smart-contract`

**Description:**
Implement the `initialize()` function in `contracts/market_factory/src/lib.rs`.
This is the one-time setup function called after the factory contract is deployed.

**What to implement:**
- Check that the contract has not already been initialized (panic if it has).
- Build a `ProtocolConfig` struct from the provided arguments.
- Store the config under the `CONFIG` storage key.
- Set `MARKET_COUNT` to `0`.
- Initialize `ALL_MARKETS` as an empty `Vec`.

**Acceptance Criteria:**
- [ ] Calling `initialize()` a second time panics with a descriptive error.
- [ ] `get_config()` returns the stored config after initialization.
- [ ] All fields of `ProtocolConfig` are correctly stored.
- [ ] Unit test covers the happy path and the double-init panic case.

---

### Issue #2
**Title:** `[contracts] Implement create_market() in MarketFactory`
**Labels:** `smart-contract` `intermediate`

**Description:**
Implement `create_market()` in `contracts/market_factory/src/lib.rs`.
This deploys a new `Market` contract for a boxing fight and registers it in the factory.

**What to implement:**
- Validate: `betting_ends_at < scheduled_at`, fighters have non-empty names, `scheduled_at` is in the future, protocol is not paused.
- Generate a unique `market_id` by hashing fighter names + `scheduled_at` + `MARKET_COUNT`.
- Deploy a new `Market` contract instance using the Soroban SDK deploy API.
- Call `Market::initialize()` on the deployed contract with all market parameters.
- Store the contract address under `MARKET_{market_id}`.
- Append `market_id` to `ALL_MARKETS`.
- Increment `MARKET_COUNT`.
- Emit a `MarketCreated` event.
- Return the `market_id`.

**Acceptance Criteria:**
- [ ] Returns a unique `market_id`.
- [ ] Deployed Market contract address is retrievable via `get_market_address()`.
- [ ] `ALL_MARKETS` contains the new ID.
- [ ] Panics if `betting_ends_at >= scheduled_at`.
- [ ] Panics if protocol is paused.
- [ ] `MarketCreated` event is emitted with correct fields.
- [ ] Unit tests cover happy path and all validation panics.

---

### Issue #3
**Title:** `[contracts] Implement get_markets_paginated() in MarketFactory`
**Labels:** `good first issue` `smart-contract`

**Description:**
Implement `get_markets_paginated()` in `contracts/market_factory/src/lib.rs`.
Returns a slice of market IDs for UI browsing without loading the full list.

**What to implement:**
- Read `ALL_MARKETS` from storage.
- Slice from `offset` to `offset + limit`.
- Handle edge cases: offset beyond end of list returns empty Vec, limit larger than remaining items returns what remains.

**Acceptance Criteria:**
- [ ] Correct slice returned for valid offset/limit.
- [ ] Empty vec returned when offset >= total count.
- [ ] No panic on any valid `u32` input combination.
- [ ] Unit test covers offset=0, mid-list offset, offset at end, and limit > remaining.

---

### Issue #4
**Title:** `[contracts] Implement pause_protocol() and unpause_protocol()`
**Labels:** `smart-contract` `intermediate`

**Description:**
Implement the `pause_protocol()` and `unpause_protocol()` functions in `contracts/market_factory/src/lib.rs`.
These allow the admin to halt the entire protocol in an emergency.

**What to implement:**
- Both functions must call `require_auth(&admin)`.
- `pause_protocol()`: set `config.paused = true`, store updated config, emit `ProtocolPaused` event.
- `unpause_protocol()`: set `config.paused = false`, store updated config, emit `ProtocolUnpaused` event.
- `create_market()` and `place_bet()` must check `config.paused` and panic if true.

**Acceptance Criteria:**
- [ ] Non-admin caller panics on both functions.
- [ ] After `pause_protocol()`, `create_market()` panics with a "protocol paused" error.
- [ ] After `unpause_protocol()`, `create_market()` works again.
- [ ] Both events are emitted with correct fields.
- [ ] Unit tests cover all cases.

---

### Issue #5
**Title:** `[contracts] Implement two-step admin transfer (transfer_admin + accept_admin)`
**Labels:** `smart-contract` `advanced`

**Description:**
Implement `transfer_admin()` and `accept_admin()` in `contracts/market_factory/src/lib.rs`.
Two-step pattern prevents accidental admin lockout.

**What to implement:**
- `transfer_admin(admin, new_admin)`: require auth from current admin, store `new_admin` as `PENDING_ADMIN`. Emit `AdminTransferInitiated` event.
- `accept_admin(new_admin)`: require auth from `new_admin`, verify it matches `PENDING_ADMIN`, update `config.admin = new_admin`, clear `PENDING_ADMIN`. Emit `AdminTransferCompleted` event.
- Calling `accept_admin()` with the wrong address must panic.
- Calling `transfer_admin()` when there is already a `PENDING_ADMIN` should overwrite it (the old pending is cancelled).

**Acceptance Criteria:**
- [ ] `accept_admin()` by a non-pending address panics.
- [ ] After `accept_admin()`, the old admin can no longer call admin-only functions.
- [ ] `PENDING_ADMIN` is cleared after a successful `accept_admin()`.
- [ ] Unit tests cover full happy path and all error cases.

---

### Issue #6
**Title:** `[contracts] Implement Market.initialize()`
**Labels:** `good first issue` `smart-contract`

**Description:**
Implement `initialize()` in `contracts/market/src/lib.rs`.
Called by the MarketFactory immediately after the Market contract is deployed.

**What to implement:**
- Verify the caller is the factory address stored during deployment (or passed as `factory` arg).
- Build a `Market` struct with `pool_a = 0`, `pool_b = 0`, `total_pool = 0`, `status = MarketStatus::Open`.
- Store the struct under `MARKET_INFO`.
- Panic if already initialized.

**Acceptance Criteria:**
- [ ] Non-factory caller panics.
- [ ] `get_market_info()` returns the stored market with correct field values.
- [ ] `status` is `Open` after initialization.
- [ ] Double-init panics.
- [ ] Unit test covers happy path and error cases.

---

### Issue #7
**Title:** `[contracts] Implement place_bet() in Market contract`
**Labels:** `smart-contract` `intermediate`

**Description:**
Implement `place_bet()` in `contracts/market/src/lib.rs`.
This is the core betting function — it accepts XLM from a bettor and records their stake.

**What to implement:**
- Call `bettor.require_auth()`.
- Validate: `market.status == Open`, `current_ledger_time < betting_ends_at`, `amount >= min_bet`, `amount <= max_bet`.
- Transfer XLM from bettor to this contract using the Stellar token interface.
- Build a `Bet` struct with a unique `bet_id` (hash of `market_id + bettor + timestamp + nonce`).
- Store the `Bet` under `BET_{bet_id}`.
- Append `bet_id` to `BETS_BY_ADDR_{bettor}`.
- Update `market.pool_a` or `market.pool_b` and `market.total_pool`.
- Store updated `MARKET_INFO`.
- Emit `BetPlaced` event.
- Return `bet_id`.

**Acceptance Criteria:**
- [ ] XLM actually transferred to contract (verified in test by checking balances).
- [ ] Pools updated correctly for both sides.
- [ ] `BetPlaced` event emitted with correct fields.
- [ ] Panics if market not Open, after deadline, or amount out of range.
- [ ] Multiple bets from the same bettor all stored correctly.
- [ ] Unit tests cover happy paths and all validation panics.

---

### Issue #8
**Title:** `[contracts] Implement lock_market() in Market contract`
**Labels:** `smart-contract` `intermediate`

**Description:**
Implement `lock_market()` in `contracts/market/src/lib.rs`.
Transitions the market from `Open` to `Locked` — no more bets after this point.

**What to implement:**
- Allow the oracle to call it at any time (via `oracle.require_auth()`).
- Also allow anyone to call it (no auth required) if `current_ledger_time >= betting_ends_at` — this is the auto-lock trigger.
- Validate that current status is `Open` (panic otherwise).
- Set `market.status = Locked`, store updated `MARKET_INFO`.
- Emit `MarketLocked` event with `locked_at` timestamp.

**Acceptance Criteria:**
- [ ] Oracle can lock at any time.
- [ ] Anyone can lock after `betting_ends_at` has passed.
- [ ] Cannot lock if status is not `Open`.
- [ ] `place_bet()` panics after market is locked.
- [ ] `MarketLocked` event emitted.
- [ ] Unit tests cover all paths.

---

### Issue #9
**Title:** `[contracts] Implement resolve_market() in Market contract`
**Labels:** `smart-contract` `intermediate`

**Description:**
Implement `resolve_market()` in `contracts/market/src/lib.rs`.
Called by the oracle after a fight concludes with the official outcome.

**What to implement:**
- Require auth from `oracle_address` stored in `MARKET_INFO`.
- Validate `market.status == Locked`.
- Store the `outcome` in `MARKET_INFO`.
- If `outcome == Outcome::NoContest`, set `status = Cancelled` (triggers refund mode).
- Otherwise set `status = Resolved`.
- Record `resolved_at` timestamp in MARKET_INFO.
- Emit `MarketResolved` event with `outcome` and `resolved_at`.

**Acceptance Criteria:**
- [ ] Non-oracle caller panics.
- [ ] Panics if status is not `Locked`.
- [ ] `NoContest` → `Cancelled`, all other outcomes → `Resolved`.
- [ ] `resolved_at` stored correctly.
- [ ] `MarketResolved` event emitted.
- [ ] Unit tests cover all outcome variants and error cases.

---

### Issue #10
**Title:** `[contracts] Implement claim_winnings() with fee deduction`
**Labels:** `smart-contract` `advanced`

**Description:**
Implement `claim_winnings()` in `contracts/market/src/lib.rs`.
Winning bettors call this to receive their proportional share of the prize pool.

**What to implement:**
- Require auth from `bettor`.
- Read the `Bet` for `bet_id`. Verify `bet.bettor == bettor`.
- Verify `market.status == Resolved` and `market.outcome` matches `bet.side`.
- Verify `CLAIMED_{bet_id}` is false.
- **Set `CLAIMED_{bet_id} = true` BEFORE any token transfer** (re-entrancy guard).
- Calculate payout: `(bet.amount / winning_pool) * (total_pool * (1 - fee_bp / 10_000))`. Use checked i128 arithmetic.
- Calculate fee: `total_pool * fee_bp / 10_000`.
- Transfer payout XLM to bettor.
- Transfer fee XLM to `fee_collector`.
- Update `bet.claimed = true` in storage.
- Emit `WinningsClaimed` event with `payout` amount.
- Return payout.

**Acceptance Criteria:**
- [ ] Payout formula matches spec exactly.
- [ ] Fee deducted and sent to `fee_collector`.
- [ ] Double-claim panics (claimed flag set before transfer).
- [ ] Wrong bettor, wrong side, unresolved market — all panic correctly.
- [ ] No overflow with realistic i128 values (test with large pools).
- [ ] Full unit test suite.

---

### Issue #11
**Title:** `[contracts] Implement claim_refund() for cancelled markets`
**Labels:** `smart-contract` `intermediate`

**Description:**
Implement `claim_refund()` in `contracts/market/src/lib.rs`.
Returns the full stake to a bettor when a market is `Cancelled` or the outcome is `NoContest`.

**What to implement:**
- Require auth from `bettor`.
- Verify `market.status == Cancelled` OR `market.outcome == NoContest`.
- Verify `bettor` owns the bet and `CLAIMED_{bet_id}` is false.
- Set `CLAIMED_{bet_id} = true` BEFORE transfer.
- Transfer `bet.amount` in full (no fee deducted on refunds).
- Emit `RefundClaimed` event.
- Return `bet.amount`.

**Acceptance Criteria:**
- [ ] Full amount returned with no fee.
- [ ] Double-refund panics.
- [ ] Panics if market is Resolved (not cancelled) — must use `claim_winnings` instead.
- [ ] Unit tests cover both Cancelled and NoContest paths.

---

### Issue #12
**Title:** `[contracts] Implement raise_dispute() in Market contract`
**Labels:** `smart-contract` `advanced`

**Description:**
Implement `raise_dispute()` in `contracts/market/src/lib.rs`.
Allows a bettor to dispute a market resolution within the dispute window.

**What to implement:**
- Require auth from `bettor`.
- Verify the bettor has at least one bet on this market (check `BETS_BY_ADDR_{bettor}`).
- Verify `market.status == Resolved` (cannot dispute Cancelled or still-Open markets).
- Verify `current_time <= resolved_at + dispute_window_sec` (read from ProtocolConfig via factory cross-contract call, or store locally at resolution time).
- Verify `DISPUTE_RAISED` is false (only one active dispute allowed).
- Set `DISPUTE_RAISED = true`, store `DISPUTE_REASON`.
- Set `market.status = Disputed`.
- Emit `DisputeRaised` event.

**Acceptance Criteria:**
- [ ] Only bettors who participated can raise a dispute.
- [ ] Panics if dispute window has passed.
- [ ] Panics if dispute already raised.
- [ ] Status transitions to `Disputed`.
- [ ] Claims are frozen (claim_winnings panics on Disputed market).
- [ ] Unit tests cover all cases.

---

### Issue #13
**Title:** `[contracts] Implement resolve_dispute() in Market contract`
**Labels:** `smart-contract` `advanced`

**Description:**
Implement `resolve_dispute()` in `contracts/market/src/lib.rs`.
Admin overrides the oracle outcome to settle a disputed market.

**What to implement:**
- Require auth from factory admin (either pass admin address as arg or read from factory config via cross-contract call).
- Verify `market.status == Disputed`.
- Update `market.outcome = override_outcome`.
- Set `market.status = Resolved`.
- Clear `DISPUTE_RAISED`.
- Emit `DisputeResolved` event with `override_outcome` and `resolved_by`.

**Acceptance Criteria:**
- [ ] Non-admin caller panics.
- [ ] Panics if market is not Disputed.
- [ ] Outcome updated to override value.
- [ ] Claims re-open with the correct (possibly changed) outcome.
- [ ] `DisputeResolved` event emitted.
- [ ] Unit tests cover happy path and error cases.

---

### Issue #14
**Title:** `[contracts] Implement calculate_payout() read-only helper`
**Labels:** `good first issue` `smart-contract`

**Description:**
Implement `calculate_payout()` in `contracts/market/src/lib.rs`.
Read-only helper used by the frontend to show live payout estimates before placing a bet.

**What to implement:**
- Read the `Bet` for `bet_id` from storage.
- Read current `MARKET_INFO` for pool sizes and fee.
- Apply the payout formula: `(bet.amount / winning_pool) * (total_pool * (1 - fee_bp / 10_000))`.
- Return the estimated payout in stroops.
- **Must not write to storage** — this is a view function.

**Acceptance Criteria:**
- [ ] Returns correct value matching the payout formula.
- [ ] Returns 0 gracefully if the winning pool is 0 (no bets on that side yet).
- [ ] No storage writes (verified by checking no events emitted).
- [ ] Unit test with multiple pool size scenarios.

---

### Issue #15
**Title:** `[contracts] Implement get_pool_odds() helper`
**Labels:** `good first issue` `smart-contract`

**Description:**
Implement `get_pool_odds()` in `contracts/market/src/lib.rs`.
Used by the frontend to display live implied odds for each fighter.

**What to implement:**
- Read `MARKET_INFO` for `pool_a`, `pool_b`, `total_pool`.
- If `total_pool == 0`, return `(0, 0, 5000, 5000)` — a 50/50 even split in basis points.
- Otherwise compute: `odds_a = (pool_a * 10_000) / total_pool` and `odds_b = 10_000 - odds_a`.
- Return `(pool_a, pool_b, odds_a_bp, odds_b_bp)`.

**Acceptance Criteria:**
- [ ] Correct basis-point odds returned for various pool ratios.
- [ ] 50/50 returned when no bets placed yet.
- [ ] `odds_a + odds_b == 10_000` always.
- [ ] Unit test with edge cases: all on one side, equal split.

---

### Issue #16
**Title:** `[contracts] Implement get_bets_by_address() in Market`
**Labels:** `good first issue` `smart-contract`

**Description:**
Implement `get_bets_by_address()` in `contracts/market/src/lib.rs`.
Returns all bets placed by a specific address on this market.

**What to implement:**
- Read `BETS_BY_ADDR_{bettor}` — a `Vec<Bytes>` of bet IDs.
- For each `bet_id`, read the `Bet` from `BET_{bet_id}`.
- Return the collected `Vec<Bet>`.
- Return an empty `Vec` if the address has no bets (do not panic).

**Acceptance Criteria:**
- [ ] Returns correct bets for a bettor with multiple bets.
- [ ] Returns empty Vec for an address with no bets.
- [ ] No panics on any valid address.
- [ ] Unit test covers both cases.

---

### Issue #17
**Title:** `[contracts] Add MarketCreated event emission in create_market()`
**Labels:** `good first issue` `smart-contract`

**Description:**
Add structured event emission to `create_market()` in `contracts/market_factory/src/lib.rs`.

The event must include:
- `market_id` (Bytes)
- `fighter_a_name` (String)
- `fighter_b_name` (String)
- `scheduled_at` (u64)
- `oracle` (Address)
- `created_by` (Address)

Use `env.events().publish((Symbol::new(&env, "MarketCreated"),), (market_id, fighter_a_name, ...))`.

**Acceptance Criteria:**
- [ ] Event emitted on every successful `create_market()` call.
- [ ] All required fields present in the event body.
- [ ] Unit test asserts the event was emitted with correct values.

---

### Issue #18
**Title:** `[contracts] Add BetPlaced event emission in place_bet()`
**Labels:** `good first issue` `smart-contract`

**Description:**
Add structured event emission to `place_bet()` in `contracts/market/src/lib.rs`.

The event must include:
- `bet_id` (Bytes)
- `market_id` (Bytes)
- `bettor` (Address)
- `side` (BetSide)
- `amount` (i128)
- `placed_at` (u64)

**Acceptance Criteria:**
- [ ] Event emitted on every successful `place_bet()` call.
- [ ] All required fields present.
- [ ] Unit test asserts event values.

---

### Issue #19
**Title:** `[contracts] Add MarketResolved event emission in resolve_market()`
**Labels:** `good first issue` `smart-contract`

**Description:**
Add `MarketResolved` event to `resolve_market()` in `contracts/market/src/lib.rs`.

The event must include:
- `market_id` (Bytes)
- `outcome` (Outcome)
- `resolved_at` (u64)

**Acceptance Criteria:**
- [ ] Event emitted on every successful `resolve_market()` call.
- [ ] `NoContest` outcome still emits the event (before status becomes Cancelled).
- [ ] Unit test asserts event values.

---

### Issue #20
**Title:** `[contracts] Add WinningsClaimed event emission in claim_winnings()`
**Labels:** `good first issue` `smart-contract`

**Description:**
Add `WinningsClaimed` event to `claim_winnings()` in `contracts/market/src/lib.rs`.

The event must include:
- `bet_id` (Bytes)
- `bettor` (Address)
- `payout` (i128)
- `fee_paid` (i128)
- `claimed_at` (u64)

**Acceptance Criteria:**
- [ ] Event emitted after a successful claim.
- [ ] All fields correct including fee amount.
- [ ] Unit test asserts event values.

---

### Issue #21
**Title:** `[contracts] Implement Treasury.initialize()`
**Labels:** `good first issue` `smart-contract`

**Description:**
Implement `initialize()` in `contracts/treasury/src/lib.rs`.

**What to implement:**
- Panic if already initialized.
- Store `ADMIN` and `FACTORY` addresses.
- Set `BALANCE = 0`, `TOTAL_FEES_EARNED = 0`.
- Initialize `WITHDRAWAL_LOG` as empty Vec.

**Acceptance Criteria:**
- [ ] Double-init panics.
- [ ] `get_balance()` returns 0 after init.
- [ ] Unit test covers happy path and double-init.

---

### Issue #22
**Title:** `[contracts] Implement Treasury.deposit_fees()`
**Labels:** `smart-contract` `intermediate`

**Description:**
Implement `deposit_fees()` in `contracts/treasury/src/lib.rs`.
Called by Market contracts when distributing protocol fees.

**What to implement:**
- Verify the caller is a Market contract registered in the factory (cross-contract read from factory's `MARKET_{id}` storage or pass `market_id` and verify).
- Transfer `amount` XLM from caller to Treasury contract.
- Add `amount` to `BALANCE` and `TOTAL_FEES_EARNED`.
- Emit `FeesDeposited` event.

**Acceptance Criteria:**
- [ ] Unauthorized caller panics.
- [ ] `BALANCE` increases by exactly `amount`.
- [ ] `TOTAL_FEES_EARNED` increases (never decreases).
- [ ] Unit test with mock market caller.

---

### Issue #23
**Title:** `[contracts] Implement Treasury.withdraw_fees()`
**Labels:** `smart-contract` `intermediate`

**Description:**
Implement `withdraw_fees()` in `contracts/treasury/src/lib.rs`.

**What to implement:**
- `admin.require_auth()`.
- Verify `amount <= BALANCE` (panic if not enough funds).
- Deduct `amount` from `BALANCE`.
- Transfer `amount` XLM to `recipient`.
- Append `(recipient, amount, timestamp)` to `WITHDRAWAL_LOG`.
- Emit `FeesWithdrawn` event.

**Acceptance Criteria:**
- [ ] Non-admin panics.
- [ ] Panics if amount > balance.
- [ ] Balance decreases correctly.
- [ ] Withdrawal logged.
- [ ] Unit tests cover happy path and errors.

---

### Issue #24
**Title:** `[contracts] Implement Treasury.emergency_drain()`
**Labels:** `smart-contract` `advanced` `security`

**Description:**
Implement `emergency_drain()` in `contracts/treasury/src/lib.rs`.
Drains all treasury funds in an emergency. Should only work when the protocol is paused.

**What to implement:**
- `admin.require_auth()`.
- Read `ProtocolConfig` from the factory via cross-contract call (or accept `factory` address and read from it) — verify `config.paused == true`.
- Transfer full `BALANCE` to `recipient`.
- Set `BALANCE = 0`.
- Append drain to `WITHDRAWAL_LOG`.
- Emit `EmergencyDrain` event.
- Return the drained amount.

**Acceptance Criteria:**
- [ ] Non-admin panics.
- [ ] Panics if protocol is not paused.
- [ ] Full balance transferred.
- [ ] Balance = 0 after drain.
- [ ] Event emitted.
- [ ] Unit test.

---

### Issue #25
**Title:** `[contracts] Add bet amount validation (min/max) in place_bet()`
**Labels:** `smart-contract` `intermediate`

**Description:**
Enforce `min_bet_amount` and `max_bet_amount` from `ProtocolConfig` inside `place_bet()`.

The Market contract receives these limits at `initialize()` time and stores them locally (or reads from the factory). Add the validation gate before any token transfer.

**Acceptance Criteria:**
- [ ] Bet below `min_bet_amount` panics with "below minimum bet" error.
- [ ] Bet above `max_bet_amount` panics with "above maximum bet" error.
- [ ] Bet exactly at `min_bet_amount` succeeds.
- [ ] Bet exactly at `max_bet_amount` succeeds.
- [ ] Unit tests cover all four boundary cases.

---

### Issue #26
**Title:** `[contracts] Add re-entrancy guard to claim_winnings() and claim_refund()`
**Labels:** `smart-contract` `advanced` `security`

**Description:**
Ensure both claim functions mark the bet as claimed BEFORE transferring any XLM.
This is the checks-effects-interactions pattern that prevents re-entrancy.

Audit both `claim_winnings()` and `claim_refund()` and verify the order is:
1. Read state
2. Validate state
3. **Set `CLAIMED_{bet_id} = true`** ← this must happen before step 4
4. Transfer XLM

**Acceptance Criteria:**
- [ ] `CLAIMED_{bet_id}` is set to `true` on the line immediately before the first `transfer()` call.
- [ ] A second call to `claim_winnings()` with the same `bet_id` panics before any transfer occurs.
- [ ] Unit test that calls `claim_winnings()` twice in the same test block confirms the second call panics.
- [ ] Code review comment added explaining the ordering requirement.

---

### Issue #27
**Title:** `[contracts] Write unit tests for MarketFactory`
**Labels:** `smart-contract` `testing`

**Description:**
Write a comprehensive `#[cfg(test)]` test module in `contracts/market_factory/src/lib.rs`.

Cover:
- `initialize()` — happy path and double-init panic
- `create_market()` — happy path, validation panics, event emission
- `get_markets_paginated()` — multiple offset/limit scenarios
- `pause_protocol()` / `unpause_protocol()` — auth and behavior
- `transfer_admin()` / `accept_admin()` — full two-step flow and error cases
- `update_config()` — happy path and non-admin panic

**Acceptance Criteria:**
- [ ] `cargo test -p market_factory` passes with 0 failures.
- [ ] Every public function has at least one test.
- [ ] Every panic path has at least one test.
- [ ] Tests use `soroban_sdk::testutils` — no external dependencies.

---

### Issue #28
**Title:** `[contracts] Write unit tests for Market contract`
**Labels:** `smart-contract` `testing` `advanced`

**Description:**
Write a comprehensive `#[cfg(test)]` test module in `contracts/market/src/lib.rs`.

Cover the full lifecycle:
- `initialize()` → `place_bet()` (multiple bettors) → `lock_market()` → `resolve_market()` → `claim_winnings()` / `claim_refund()`
- Dispute flow: `resolve_market()` → `raise_dispute()` → `resolve_dispute()` → `claim_winnings()`
- All validation panics for each function
- Edge case: Draw outcome
- Edge case: NoContest → Cancelled → `claim_refund()`

**Acceptance Criteria:**
- [ ] `cargo test -p market` passes with 0 failures.
- [ ] Full lifecycle test exists.
- [ ] Every panic path has a test.
- [ ] Payout formula verified with concrete numbers in at least one test.

---

### Issue #29
**Title:** `[contracts] Write unit tests for Treasury`
**Labels:** `smart-contract` `testing`

**Description:**
Write tests in `contracts/treasury/src/lib.rs` covering:
- `initialize()` — happy path and double-init
- `deposit_fees()` — authorized and unauthorized callers
- `withdraw_fees()` — happy path, over-withdraw panic, non-admin panic
- `emergency_drain()` — when paused (success) and when not paused (panic)
- `get_withdrawal_log()` — verify entries after withdrawals

**Acceptance Criteria:**
- [ ] `cargo test -p treasury` passes.
- [ ] All edge cases covered.
- [ ] Balance correctly tracked across multiple deposits and withdrawals.

---

### Issue #30
**Title:** `[contracts] Audit and enforce authorization on all admin functions`
**Labels:** `smart-contract` `security` `intermediate`

**Description:**
Audit every function in all three contracts. Every function that changes protocol state and is restricted to admin must call `require_auth()` as its very first line.

Functions to check:
- MarketFactory: `update_config`, `pause_protocol`, `unpause_protocol`, `transfer_admin`
- Market: `resolve_dispute`
- Treasury: `withdraw_fees`, `emergency_drain`

For each function: confirm `require_auth()` is the first statement, and write a unit test that calls it with an unauthorized signer and asserts it panics.

**Acceptance Criteria:**
- [ ] Every admin function has `require_auth()` as its first call.
- [ ] Unit test for unauthorized call exists for every admin function.
- [ ] No state changes occur before auth check.

---

### Issue #31
**Title:** `[contracts] Implement market cancellation flow`
**Labels:** `smart-contract` `advanced`

**Description:**
Admin should be able to cancel a market (e.g. fight postponed), which enables full refunds.

Add a new function `cancel_market(admin: Address)` to the Market contract:
- Require auth from factory admin.
- Validate: market status is `Open` or `Locked` (not already Resolved or Cancelled).
- Set `market.status = Cancelled`.
- Emit `MarketCancelled` event.
- This enables `claim_refund()` for all bettors.

Also add the `cancel_market` route to MarketFactory so the admin can call it through the factory using `POST /api/admin/markets/cancel`.

**Acceptance Criteria:**
- [ ] Admin can cancel an Open or Locked market.
- [ ] Cannot cancel an already Resolved or Cancelled market.
- [ ] All bettors can call `claim_refund()` after cancellation.
- [ ] `MarketCancelled` event emitted.
- [ ] Unit tests cover all cases.

---

### Issue #32
**Title:** `[contracts] Enforce betting deadline in place_bet()`
**Labels:** `smart-contract` `intermediate`

**Description:**
`place_bet()` must reject bets placed after `betting_ends_at`, even if the market is still in `Open` status.

**What to implement:**
- In `place_bet()`, after the status check, add:
  `if env.ledger().timestamp() > market.betting_ends_at { panic!("betting period has ended") }`
- This is separate from `lock_market()` — a bet could be attempted while the market is technically still `Open` but past the deadline.

**Acceptance Criteria:**
- [ ] Bet placed at `betting_ends_at + 1` second panics.
- [ ] Bet placed at exactly `betting_ends_at` succeeds.
- [ ] Unit test manipulates ledger timestamp to test both cases.

---

### Issue #33
**Title:** `[contracts] Handle Draw outcome in claim logic`
**Labels:** `smart-contract` `advanced`

**Description:**
When the outcome is `Draw`, all bettors should receive a full refund of their original stake (no fee deducted, to keep it simple and fair).

**What to implement:**
- In `resolve_market()`, if `outcome == Draw`, set `status = Cancelled` (reuse the existing refund path).
- This means `claim_refund()` handles Draw automatically — no changes needed there.
- Document this behavior in a code comment and in `docs/contracts.md`.

**Acceptance Criteria:**
- [ ] Draw outcome → status becomes Cancelled.
- [ ] All bettors (both sides) can claim full refunds.
- [ ] No fee deducted on Draw refunds.
- [ ] Unit test for full Draw flow.
- [ ] `docs/contracts.md` updated with Draw behavior note.

---

### Issue #34
**Title:** `[contracts] Add protocol fee calculation utility function`
**Labels:** `good first issue` `smart-contract`

**Description:**
Add a shared utility function `calculate_fee(amount: i128, fee_bp: u32) -> i128` in `contracts/shared/types.rs`.

**What to implement:**
- Return `(amount * fee_bp as i128) / 10_000`.
- Use `i128::checked_mul` and `i128::checked_div` to prevent overflow.
- Panic with a descriptive message if overflow occurs (should be unreachable with realistic values).

**Acceptance Criteria:**
- [ ] Correct fee for various basis points (0, 100, 200, 500, 1000, 10000).
- [ ] Returns 0 when `fee_bp == 0`.
- [ ] Returns full amount when `fee_bp == 10_000`.
- [ ] Unit tests for all boundary values.

---

### Issue #35
**Title:** `[contracts] Create Soroban deployment scripts for Testnet`
**Labels:** `smart-contract` `devops` `intermediate`

**Description:**
Write shell scripts to deploy MarketFactory and Treasury to Stellar Testnet and print their contract IDs.

Create `contracts/scripts/deploy_testnet.sh`:
1. Build all contracts with `cargo build --release --target wasm32-unknown-unknown`
2. Optimize with `soroban contract optimize`
3. Deploy `treasury` with `soroban contract deploy`
4. Deploy `market_factory` with `soroban contract deploy`
5. Call `initialize()` on both with Testnet admin keypair
6. Print contract IDs to stdout and save to `contracts/scripts/.env.testnet`

**Acceptance Criteria:**
- [ ] Script runs end-to-end on Stellar Testnet with no manual steps.
- [ ] Contract IDs printed and saved to file.
- [ ] Script is idempotent (re-running does not break anything — redeploys fresh instances).
- [ ] `.env.testnet` added to `.gitignore`.

---

### Issue #36
**Title:** `[contracts] Set up Soroban contract testing harness`
**Labels:** `smart-contract` `good first issue`

**Description:**
Ensure the Soroban test environment is correctly configured for all three contracts.

**What to do:**
- Add `soroban-sdk = { version = "...", features = ["testutils"] }` to each contract's `Cargo.toml` under `[dev-dependencies]`.
- Create a test helper module `contracts/shared/test_utils.rs` with functions: `create_test_env() -> Env`, `create_test_address(env: &Env) -> Address`, `fund_address(env: &Env, address: &Address, amount: i128)`.
- Verify all three contracts compile and their test modules run with `cargo test`.

**Acceptance Criteria:**
- [ ] `cargo test` runs without errors in all three contract crates.
- [ ] Test helper functions available to all test modules.
- [ ] Example test in each crate demonstrates the test harness works.

---

### Issue #37
**Title:** `[contracts] Document all contract events in contracts.md`
**Labels:** `documentation` `good first issue`

**Description:**
Update `docs/contracts.md` to fully document every event emitted by all three contracts.

For each event, document:
- Event name
- Which function emits it
- All fields with their types
- When it is emitted (conditions)

Also add a section explaining how to subscribe to events using `soroban-cli` and how the backend indexer uses them.

**Acceptance Criteria:**
- [ ] All 15 events from the event table are documented.
- [ ] Each entry has: name, emitted by, fields, conditions.
- [ ] Indexer subscription example included.
- [ ] PR reviewed by a contracts maintainer.

---

### Issue #38
**Title:** `[contracts] Implement overflow-safe arithmetic throughout Market contract`
**Labels:** `smart-contract` `security` `advanced`

**Description:**
Audit all arithmetic operations in `contracts/market/src/lib.rs` and replace any unchecked `+`, `-`, `*`, `/` on `i128` values with their checked equivalents.

**What to replace:**
- `a + b` → `a.checked_add(b).expect("pool overflow")`
- `a * b` → `a.checked_mul(b).expect("multiplication overflow")`
- `a / b` → guard against divide-by-zero before calling (panic with descriptive message if b == 0)

Focus areas: pool updates in `place_bet()`, payout calculation in `claim_winnings()`, fee calculation.

**Acceptance Criteria:**
- [ ] No unchecked arithmetic on `i128` pool values.
- [ ] All panics have descriptive messages.
- [ ] Unit test with very large `i128` values (near max) passes without unexpected panics.
- [ ] `cargo clippy` passes with no integer-arithmetic warnings.

---

### Issue #39
**Title:** `[contracts] Enforce dispute window in raise_dispute()`
**Labels:** `smart-contract` `intermediate`

**Description:**
`raise_dispute()` must reject calls made after the dispute window has closed.

The dispute window is `dispute_window_sec` seconds after `market.resolved_at`.

**What to implement:**
- Store `dispute_window_sec` in `MARKET_INFO` at initialization time (passed from factory config).
- In `raise_dispute()`, check: `env.ledger().timestamp() <= market.resolved_at + market.dispute_window_sec`.
- Panic with "dispute window has closed" if outside the window.

**Acceptance Criteria:**
- [ ] Call within window succeeds.
- [ ] Call at exactly `resolved_at + dispute_window_sec` succeeds.
- [ ] Call at `resolved_at + dispute_window_sec + 1` panics.
- [ ] Unit test manipulates ledger timestamp to test both sides of the boundary.

---

### Issue #40
**Title:** `[contracts] Implement factory address registry for on-chain market lookup`
**Labels:** `smart-contract` `intermediate`

**Description:**
Fully implement the market address registry in MarketFactory so that `get_market_address()` works correctly and `ALL_MARKETS` is always in sync.

Specifically:
- `create_market()` must append the new `market_id` to `ALL_MARKETS` atomically with storing the address.
- `get_market_address()` must panic with `"market not found: {market_id}"` if the ID does not exist.
- Add a `market_exists(market_id: Bytes) -> bool` read-only function for cheap existence checks.

**Acceptance Criteria:**
- [ ] `get_market_address()` returns correct address after `create_market()`.
- [ ] `get_market_address()` panics with descriptive message for unknown IDs.
- [ ] `market_exists()` returns `true` for known IDs, `false` for unknown.
- [ ] `ALL_MARKETS` length equals `MARKET_COUNT` at all times.
- [ ] Unit tests cover all cases.

---

## BACKEND ISSUES (41–80)

---

### Issue #41
**Title:** `[backend] Set up Node.js + TypeScript project structure`
**Labels:** `good first issue` `backend`

**Description:**
Initialize the `/backend` workspace with proper configuration.

**What to set up:**
- `tsconfig.json` with `strict: true`, `target: ES2022`, `moduleResolution: node16`
- `.eslintrc.json` using `@typescript-eslint/recommended`
- `.prettierrc` with consistent formatting rules
- `jest.config.ts` for TypeScript test support
- `src/index.ts` as the app entry point that starts the Express server
- `src/app.ts` that creates and configures the Express app (separated for testability)

**Acceptance Criteria:**
- [ ] `npm run build` compiles without errors.
- [ ] `npm run dev` starts the server and logs "Server running on port 3001".
- [ ] `npm run lint` passes with no errors.
- [ ] `npm run type-check` passes.
- [ ] `npm test` runs (no tests yet, but Jest config works).

---

### Issue #42
**Title:** `[backend] Set up Prisma with PostgreSQL`
**Labels:** `good first issue` `backend` `database`

**Description:**
Configure Prisma with the schema in `backend/prisma/schema.prisma` and connect to a PostgreSQL database.

**What to do:**
- Verify schema is correct (all models, enums, relations).
- Run `npx prisma migrate dev --name init` to create the initial migration.
- Generate the Prisma client with `npx prisma generate`.
- Create `src/db.ts` that exports a singleton `PrismaClient` instance.
- Add `DATABASE_URL` to `.env.example`.

**Acceptance Criteria:**
- [ ] `npm run db:migrate` creates all tables without errors.
- [ ] `npm run db:studio` opens Prisma Studio showing all models.
- [ ] `import { db } from "./db"` works in any service file.
- [ ] Unit test that connects to a test database and runs a simple query passes.

---

### Issue #43
**Title:** `[backend] Implement getAllMarkets() service`
**Labels:** `good first issue` `backend`

**Description:**
Implement `getAllMarkets()` in `backend/src/services/market.service.ts`.

**What to implement:**
- Accept optional `filters` (status, weightClass) and `pagination` (page, limit).
- Query the `Market` table using Prisma with a `where` clause built from filters.
- Apply `skip` and `take` for pagination.
- Order by `scheduledAt` ascending.
- Extract `weightClass` from the `fighterA` JSON field for filtering (Prisma JSON path query).

**Acceptance Criteria:**
- [ ] Returns all markets when no filters passed.
- [ ] `status` filter returns only matching markets.
- [ ] Pagination returns correct slices.
- [ ] Returns empty array (not error) when no markets match.
- [ ] Integration test with seeded test data passes.

---

### Issue #44
**Title:** `[backend] Implement getMarketById() service`
**Labels:** `good first issue` `backend`

**Description:**
Implement `getMarketById()` in `backend/src/services/market.service.ts`.

**What to implement:**
- Query `Market` by primary key `id`.
- Return `null` if not found — do NOT throw.

**Acceptance Criteria:**
- [ ] Returns the market for a known ID.
- [ ] Returns `null` for an unknown ID.
- [ ] No exception thrown for unknown IDs.
- [ ] Integration test covers both cases.

---

### Issue #45
**Title:** `[backend] Implement createMarketRecord() service`
**Labels:** `backend` `intermediate`

**Description:**
Implement `createMarketRecord()` in `backend/src/services/market.service.ts`.
Called by the indexer when it detects a `MarketCreated` on-chain event.

**What to implement:**
- Use `db.market.upsert()` with `where: { id }` — safe to call again on event replay without creating duplicates.
- Map `CreateMarketDTO` fields to Prisma model fields.

**Acceptance Criteria:**
- [ ] First call creates the record.
- [ ] Second call with same ID is idempotent (no duplicate, no error).
- [ ] All required fields saved correctly.
- [ ] Integration test covers idempotency.

---

### Issue #46
**Title:** `[backend] Implement updateMarketStatus() service`
**Labels:** `backend` `intermediate`

**Description:**
Implement `updateMarketStatus()` in `backend/src/services/market.service.ts`.

**What to implement:**
- Use `db.market.update()` with `where: { id: market_id }`.
- Update `status` and optionally `outcome` and `resolvedAt`.
- If `outcome` is provided, set `resolvedAt = new Date()` when status becomes `Resolved`.

**Acceptance Criteria:**
- [ ] Status updated correctly for all MarketStatus values.
- [ ] `resolvedAt` set when transitioning to Resolved.
- [ ] `outcome` stored when provided.
- [ ] Integration test covers status transitions.

---

### Issue #47
**Title:** `[backend] Implement getBetsByAddress() service`
**Labels:** `good first issue` `backend`

**Description:**
Implement `getBetsByAddress()` in `backend/src/services/bet.service.ts`.

**What to implement:**
- Query `Bet` where `bettor == address`.
- Support optional `filters.status` by joining with `Market` and filtering by `market.outcome` vs `bet.side`.
- Support optional `filters.marketId`.
- Order by `placedAt` descending.

**Acceptance Criteria:**
- [ ] Returns all bets for a known address.
- [ ] Returns empty array for an unknown address.
- [ ] `status = "won"` filter returns only winning bets.
- [ ] Integration test covers all filter combinations.

---

### Issue #48
**Title:** `[backend] Implement recordBet() service`
**Labels:** `backend` `intermediate`

**Description:**
Implement `recordBet()` in `backend/src/services/bet.service.ts`.
Must be idempotent to handle event replays safely.

**What to implement:**
- Use `db.bet.upsert()` with `where: { id: betData.id }`.
- On conflict (same bet_id), do nothing (update with same data is fine).
- Verify the parent `market` exists before inserting.

**Acceptance Criteria:**
- [ ] First call creates the bet.
- [ ] Second call with same bet_id is idempotent.
- [ ] Throws if market_id does not exist.
- [ ] Integration test covers idempotency and missing market error.

---

### Issue #49
**Title:** `[backend] Implement calculatePotentialPayout() service`
**Labels:** `good first issue` `backend`

**Description:**
Implement `calculatePotentialPayout()` in `backend/src/services/bet.service.ts`.
Pure calculation — no DB writes.

**Formula:**
```
fee = total_pool * fee_bp / 10_000
net_pool = total_pool - fee
payout = (amount / (pool_side + amount)) * net_pool
```

Fetch the market's current `poolA`, `poolB`, and `totalPool` from the DB. Use BigInt arithmetic throughout (amounts are in stroops).

**Acceptance Criteria:**
- [ ] Returns correct payout for various pool sizes and amounts.
- [ ] Returns `0n` if the winning pool is 0 (first bet on that side).
- [ ] No DB writes.
- [ ] Unit test with concrete numbers.

---

### Issue #50
**Title:** `[backend] Implement getPortfolioSummary() service`
**Labels:** `backend` `intermediate`

**Description:**
Implement `getPortfolioSummary()` in `backend/src/services/bet.service.ts`.

**What to aggregate:**
- `totalStaked` — sum of `amount` for all bets.
- `totalWinnings` — sum of `payout` for claimed winning bets.
- `pendingClaims` — sum of estimated payout for unclaimed winning bets on resolved markets.
- `activeBets` — count of bets on Open/Locked markets.
- `completedBets` — count of bets on Resolved/Cancelled markets.
- `roi` — `(totalWinnings - totalStaked) / totalStaked * 100` as a float.

**Acceptance Criteria:**
- [ ] All fields computed correctly.
- [ ] ROI handles zero `totalStaked` without divide-by-zero (return 0).
- [ ] Integration test with seeded data verifies all fields.

---

### Issue #51
**Title:** `[backend] Implement submitFightResult() oracle service`
**Labels:** `backend` `intermediate`

**Description:**
Implement `submitFightResult()` in `backend/src/services/oracle.service.ts`.

**What to implement:**
- Verify `market_id` exists in DB (throw `NOT_FOUND` if not).
- Verify no `OracleResult` with `confirmed = true` already exists for this market.
- Create `OracleResult` with `confirmed = false`.
- Reject duplicate submissions from the same reporter for the same market.

**Acceptance Criteria:**
- [ ] Result stored with `confirmed = false`.
- [ ] Duplicate submission from same reporter rejected.
- [ ] Unknown market_id throws descriptive error.
- [ ] Integration test covers all cases.

---

### Issue #52
**Title:** `[backend] Implement confirmFightResult() oracle service`
**Labels:** `backend` `advanced`

**Description:**
Implement `confirmFightResult()` in `backend/src/services/oracle.service.ts`.
Admin confirms an oracle result and triggers on-chain resolution.

**What to implement:**
- Fetch the `OracleResult` by ID.
- Build the `resolve_market()` Soroban transaction using `@stellar/stellar-sdk`.
- Sign with `ADMIN_SECRET_KEY` from env.
- Submit to Stellar network.
- On success: set `OracleResult.confirmed = true`, call `updateMarketStatus()`.
- On failure: throw with the Stellar error message.

**Acceptance Criteria:**
- [ ] On-chain transaction submitted (verify against Testnet).
- [ ] DB updated after successful on-chain call.
- [ ] DB not updated if on-chain call fails.
- [ ] Integration test against Stellar Testnet.

---

### Issue #53
**Title:** `[backend] Implement fetchExternalResult() oracle service`
**Labels:** `backend` `advanced` `oracle`

**Description:**
Implement `fetchExternalResult()` in `backend/src/services/oracle.service.ts`.
Queries an external boxing data source for a fight outcome.

**What to implement:**
- Accept `market_id`. Look up the market to get fighter names and fight date.
- Query `BOXREC_API_URL` (from env) for the fight result.
- Normalize the response into `ExternalFightResult`.
- Return `null` if fight not yet reported (handle 404 gracefully).
- Handle network errors and API rate limits.

**Acceptance Criteria:**
- [ ] Returns normalized result for a known fight.
- [ ] Returns `null` for a fight not yet in the API.
- [ ] Network errors throw descriptive exceptions (not crash the process).
- [ ] Unit test with mocked HTTP responses covers all cases.

---

### Issue #54
**Title:** `[backend] Implement listPendingResolutions() service`
**Labels:** `good first issue` `backend`

**Description:**
Implement `listPendingResolutions()` in `backend/src/services/oracle.service.ts`.

**What to implement:**
- Query markets with `status = Locked` that do NOT have a confirmed `OracleResult`.
- Order by `scheduledAt` ascending (most overdue first).

**Acceptance Criteria:**
- [ ] Returns only Locked markets without a confirmed result.
- [ ] Locked markets WITH a confirmed result are excluded.
- [ ] Open/Resolved/Cancelled markets excluded.
- [ ] Integration test with seeded data.

---

### Issue #55
**Title:** `[backend] Implement raiseDispute() service`
**Labels:** `backend` `advanced`

**Description:**
Implement `raiseDispute()` in `backend/src/services/oracle.service.ts`.

**What to implement:**
- Verify market is `Resolved`.
- Create a `Dispute` record in DB.
- Build and submit `raise_dispute()` Soroban transaction.
- Update market status to `Disputed` in DB.
- Log action in `AdminLog`.

**Acceptance Criteria:**
- [ ] Dispute record created in DB.
- [ ] On-chain tx submitted.
- [ ] Market status updated to Disputed.
- [ ] Throws if market is not Resolved.

---

### Issue #56
**Title:** `[backend] Implement resolveDispute() service`
**Labels:** `backend` `advanced`

**Description:**
Implement `resolveDispute()` in `backend/src/services/oracle.service.ts`.

**What to implement:**
- Fetch dispute by ID.
- Build and submit `resolve_dispute()` Soroban transaction with override_outcome.
- On success: update `Dispute.resolvedAt`, update market status to `Resolved` with new outcome, log to `AdminLog`.

**Acceptance Criteria:**
- [ ] On-chain tx submitted.
- [ ] Dispute record updated with resolved timestamp.
- [ ] Market outcome updated to override value.
- [ ] Action logged in AdminLog.

---

### Issue #57
**Title:** `[backend] Implement startIndexer()`
**Labels:** `backend` `advanced` `indexer`

**Description:**
Implement `startIndexer()` in `backend/src/services/indexer.service.ts`.

**What to implement:**
- Read `STELLAR_RPC_URL` and `MARKET_FACTORY_CONTRACT_ID` from env.
- Call `getLastIndexedLedger()` to get the resume point.
- Poll the Soroban RPC `getEvents` endpoint every 5 seconds.
- For each new ledger, call `processLedger()`.
- Call `saveLastIndexedLedger()` after each successful batch.
- Handle connection errors with exponential backoff (max 30s between retries).

**Acceptance Criteria:**
- [ ] Indexer starts and processes events from the last saved ledger.
- [ ] Connection errors are retried with backoff — process does not crash.
- [ ] Resumes correctly after a restart (using saved ledger).
- [ ] Integration test against Stellar Testnet.

---

### Issue #58
**Title:** `[backend] Implement getLastIndexedLedger() and saveLastIndexedLedger()`
**Labels:** `backend` `intermediate`

**Description:**
Implement both functions in `backend/src/services/indexer.service.ts`.

**What to implement:**
- `getLastIndexedLedger()`: `db.indexerState.findUnique({ where: { id: 1 } })` → return `lastLedger` or `0` if no row.
- `saveLastIndexedLedger(ledger)`: `db.indexerState.upsert({ where: { id: 1 }, ... })` — update singleton row.

**Acceptance Criteria:**
- [ ] Returns `0` on fresh DB (no row).
- [ ] After `saveLastIndexedLedger(500)`, `getLastIndexedLedger()` returns `500`.
- [ ] Upsert is atomic — safe to call from multiple process restarts.
- [ ] Unit test covers fresh start and subsequent saves.

---

### Issue #59
**Title:** `[backend] Implement processLedger() event router`
**Labels:** `backend` `advanced` `indexer`

**Description:**
Implement `processLedger()` in `backend/src/services/indexer.service.ts`.
Routes each event in a ledger to the correct handler.

**What to implement:**
- Iterate `ledger.events`.
- Switch on `event.type`:
  - `"MarketCreated"` → `handleMarketCreatedEvent(event)`
  - `"BetPlaced"` → `handleBetPlacedEvent(event)`
  - `"MarketLocked"` → `handleMarketLockedEvent(event)`
  - `"MarketResolved"` → `handleMarketResolvedEvent(event)`
  - `"WinningsClaimed"` / `"RefundClaimed"` → `handleWinnersClaimedEvent(event)`
  - `"DisputeRaised"` / `"DisputeResolved"` → `handleDisputeEvent(event)`
  - Unknown types → log warning, do not throw.
- Wrap all handlers in a DB transaction — either all succeed or none persist.

**Acceptance Criteria:**
- [ ] All event types routed correctly.
- [ ] Unknown event types logged and skipped (no crash).
- [ ] If one handler throws, the entire ledger batch is rolled back.
- [ ] Unit tests with mock events for each type.

---

### Issue #60
**Title:** `[backend] Implement handleMarketCreatedEvent()`
**Labels:** `backend` `intermediate` `indexer`

**Description:**
Implement `handleMarketCreatedEvent()` in `backend/src/services/indexer.service.ts`.

**What to implement:**
- Decode `event.body` to extract: `market_id`, `contractAddress`, `fighterA`, `fighterB`, `scheduledAt`, `bettingEndsAt`, `oracleAddress`, `createdBy`.
- Call `market.service.createMarketRecord()` with the decoded data.
- Log the processed market ID.

**Acceptance Criteria:**
- [ ] All market fields correctly decoded from raw Soroban event body.
- [ ] `createMarketRecord()` called with correct DTO.
- [ ] Idempotent — replaying the same event does not create duplicates.
- [ ] Unit test with a fixture event body.

---

### Issue #61
**Title:** `[backend] Implement handleBetPlacedEvent()`
**Labels:** `backend` `intermediate` `indexer`

**Description:**
Implement `handleBetPlacedEvent()` in `backend/src/services/indexer.service.ts`.

**What to implement:**
- Decode `event.body` for: `bet_id`, `market_id`, `bettor`, `side`, `amount`, `placed_at`.
- Call `bet.service.recordBet()`.
- Decode updated pool totals from event (or re-read from contract) and call `market.service.updateMarketPools()`.

**Acceptance Criteria:**
- [ ] Bet and pool records both updated.
- [ ] Idempotent on replay.
- [ ] Unit test with fixture event body.

---

### Issue #62
**Title:** `[backend] Implement handleMarketResolvedEvent()`
**Labels:** `backend` `intermediate` `indexer`

**Description:**
Implement `handleMarketResolvedEvent()` in `backend/src/services/indexer.service.ts`.

**What to implement:**
- Decode `event.body` for: `market_id`, `outcome`, `resolved_at`.
- Call `market.service.updateMarketStatus()` with the decoded outcome.

**Acceptance Criteria:**
- [ ] Market status and outcome updated correctly.
- [ ] Idempotent on replay.
- [ ] Unit test with fixture event body covering all Outcome variants.

---

### Issue #63
**Title:** `[backend] Implement handleWinnersClaimedEvent()`
**Labels:** `backend` `intermediate` `indexer`

**Description:**
Implement `handleWinnersClaimedEvent()` in `backend/src/services/indexer.service.ts`.
Handles both `WinningsClaimed` and `RefundClaimed` events.

**What to implement:**
- Decode `event.body` for: `bet_id`, `bettor`, `payout`.
- Call `bet.service.markBetClaimed()`.

**Acceptance Criteria:**
- [ ] Bet marked as claimed with correct payout.
- [ ] Handles both WinningsClaimed and RefundClaimed event types.
- [ ] Idempotent on replay.
- [ ] Unit test for both event types.

---

### Issue #64
**Title:** `[backend] Implement recoverMissedEvents()`
**Labels:** `backend` `advanced` `indexer`

**Description:**
Implement `recoverMissedEvents()` in `backend/src/services/indexer.service.ts`.
Replays a range of ledgers to recover from indexer downtime.

**What to implement:**
- Fetch ledgers from `fromLedger` to `toLedger` using the Soroban RPC `getLedgers` endpoint.
- For each ledger, call `processLedger()`.
- Since all handlers are idempotent (upsert), this is safe to run even on already-processed ledgers.
- Log progress every 100 ledgers.

**Acceptance Criteria:**
- [ ] Processes the full range without errors.
- [ ] No duplicates created (idempotency).
- [ ] Works correctly when `fromLedger > current latest` (no-op).
- [ ] Integration test against Testnet for a small ledger range.

---

### Issue #65
**Title:** `[backend] Implement GET /api/markets endpoint`
**Labels:** `good first issue` `backend` `api`

**Description:**
Implement `getMarketsHandler()` in `backend/src/api/controllers/market.controller.ts`
and wire it to the route in `backend/src/api/routes/market.routes.ts`.

**What to implement:**
- Parse query params: `status`, `weightClass`, `page`, `limit`.
- Validate with Zod (reject invalid status values with 400).
- Call `market.service.getAllMarkets()`.
- Return `200` with JSON array.

**Acceptance Criteria:**
- [ ] `GET /api/markets` returns 200 with array.
- [ ] Invalid `status` param returns 400 with descriptive error.
- [ ] Pagination params work correctly.
- [ ] Integration test for the endpoint.

---

### Issue #66
**Title:** `[backend] Implement GET /api/markets/:id endpoint`
**Labels:** `good first issue` `backend` `api`

**Description:**
Implement `getMarketByIdHandler()` and wire the route.

**What to implement:**
- Call `market.service.getMarketById(req.params.id)`.
- Return `200` with market object if found.
- Return `404` with `{ "error": "Market not found", "code": "NOT_FOUND" }` if null.

**Acceptance Criteria:**
- [ ] Known ID returns 200 with market.
- [ ] Unknown ID returns 404 with error body.
- [ ] Integration test for both cases.

---

### Issue #67
**Title:** `[backend] Implement GET /api/markets/:id/stats endpoint`
**Labels:** `backend` `intermediate` `api`

**Description:**
Implement `getMarketStatsHandler()` and wire the route.

**What to implement:**
- Call `market.service.getMarketStats(req.params.id)`.
- Return `200` with `MarketStats` object.
- Return `404` if market not found.

**Acceptance Criteria:**
- [ ] Returns correct stats for a market with seeded bets.
- [ ] Returns `404` for unknown market.
- [ ] Integration test with seeded data.

---

### Issue #68
**Title:** `[backend] Implement GET /api/bets/:address endpoint`
**Labels:** `good first issue` `backend` `api`

**Description:**
Implement `getBetsByAddressHandler()` and wire the route.

**What to implement:**
- Parse and validate `address` (must be a valid Stellar address format).
- Parse optional query params: `status`, `marketId`.
- Call `bet.service.getBetsByAddress()`.
- Return `200` with array (empty array is fine, not 404).

**Acceptance Criteria:**
- [ ] Returns bets for known address.
- [ ] Returns empty array for unknown address.
- [ ] Invalid Stellar address format returns 400.
- [ ] Integration test.

---

### Issue #69
**Title:** `[backend] Implement GET /api/bets/:address/portfolio endpoint`
**Labels:** `backend` `intermediate` `api`

**Description:**
Implement `getPortfolioHandler()` and wire the route.

**What to implement:**
- Validate `address` format.
- Call `bet.service.getPortfolioSummary()`.
- Return `200` with `PortfolioSummary` object.

**Acceptance Criteria:**
- [ ] Returns correct summary for a wallet with seeded bets.
- [ ] Returns zero-value summary for unknown address (not 404).
- [ ] Integration test with seeded data.

---

### Issue #70
**Title:** `[backend] Implement POST /api/oracle/submit endpoint`
**Labels:** `backend` `advanced` `api` `security`

**Description:**
Implement `submitOracleResultHandler()` and wire the route.

**What to implement:**
- Validate `Authorization: Bearer <ORACLE_API_KEY>` header. Return `401` if missing or wrong.
- Validate body with Zod: `{ market_id: string, outcome: Outcome, source: string }`.
- Call `oracle.service.submitFightResult()`.
- Return `201` with `OracleResult`.

**Acceptance Criteria:**
- [ ] Missing or wrong auth header returns 401.
- [ ] Invalid body returns 400.
- [ ] Valid submission returns 201.
- [ ] Integration test for all three cases.

---

### Issue #71
**Title:** `[backend] Implement POST /api/admin/markets/resolve endpoint`
**Labels:** `backend` `advanced` `api`

**Description:**
Implement `resolveMarketHandler()` and wire the route under `/api/admin/`.

**What to implement:**
- Apply admin auth middleware (checks `Authorization: Bearer <ADMIN_API_KEY>`).
- Validate body: `{ oracle_result_id: string }`.
- Call `oracle.service.confirmFightResult()`.
- Return `200` with `{ "status": "ok" }` on success.

**Acceptance Criteria:**
- [ ] Unauthorized returns 401.
- [ ] Invalid body returns 400.
- [ ] Valid call triggers on-chain resolution and returns 200.
- [ ] Integration test against Testnet.

---

### Issue #72
**Title:** `[backend] Add admin authentication middleware`
**Labels:** `backend` `security` `intermediate`

**Description:**
Create `backend/src/api/middleware/adminAuth.ts`.

**What to implement:**
- Read `Authorization` header. Expect `Bearer <value>`.
- Compare `<value>` against `ADMIN_API_KEY` from env using `crypto.timingSafeEqual` (constant-time comparison).
- Return `401` with `{ "error": "Unauthorized", "code": "UNAUTHORIZED" }` if check fails.
- Call `next()` if authorized.
- Apply this middleware to all routes under `/api/admin/`.

**Acceptance Criteria:**
- [ ] Wrong key returns 401.
- [ ] Missing header returns 401.
- [ ] Correct key calls `next()`.
- [ ] Uses timing-safe comparison (no timing oracle).
- [ ] Unit test for all three cases.

---

### Issue #73
**Title:** `[backend] Add Zod request validation middleware`
**Labels:** `backend` `intermediate`

**Description:**
Create a `validate(schema: ZodSchema)` middleware factory in `backend/src/api/middleware/validate.ts`.

**What to implement:**
- Accept a Zod schema for `body`, `query`, or `params`.
- On validation failure, return `400` with `{ "error": "Validation error", "code": "VALIDATION_ERROR", "details": zodError.flatten() }`.
- On success, replace `req.body` / `req.query` / `req.params` with the parsed (typed) value.
- Apply to all POST/PATCH routes.

**Acceptance Criteria:**
- [ ] Missing required field returns 400 with field-level details.
- [ ] Extra fields are stripped (not passed through).
- [ ] Valid data calls `next()`.
- [ ] Unit test for all three cases.

---

### Issue #74
**Title:** `[backend] Add rate limiting to payout estimate endpoint`
**Labels:** `backend` `security` `intermediate`

**Description:**
Apply rate limiting to `GET /api/bets/payout-estimate` to prevent abuse of the compute-heavy endpoint.

**What to implement:**
- Use `express-rate-limit` package.
- Limit: 30 requests per minute per IP.
- Return `429 Too Many Requests` with `{ "error": "Rate limit exceeded", "code": "RATE_LIMITED", "retryAfter": seconds }`.
- Apply only to this endpoint (not the whole API).

**Acceptance Criteria:**
- [ ] 31st request within 60 seconds returns 429.
- [ ] Response includes `retryAfter` value.
- [ ] Other endpoints are unaffected by this rate limit.
- [ ] Unit test simulating burst requests.

---

### Issue #75
**Title:** `[backend] Set up background job for automatic market locking`
**Labels:** `backend` `advanced`

**Description:**
Create a cron job that calls `lock_market()` on-chain for markets that are past their `bettingEndsAt` but still have `status = Open`.

**What to implement:**
- Create `backend/src/jobs/lockMarkets.job.ts`.
- Query: `db.market.findMany({ where: { status: "Open", bettingEndsAt: { lt: new Date() } } })`.
- For each matching market, build and submit the `lock_market()` Soroban transaction.
- Run every 60 seconds using `node-cron` or `setInterval`.
- Log success/failure per market.

**Acceptance Criteria:**
- [ ] Markets are locked within 60 seconds of their `bettingEndsAt`.
- [ ] Already-locked markets are not re-processed.
- [ ] Individual market failures are logged and do not crash the job.
- [ ] Integration test verifies a market transitions to Locked on-chain.

---

### Issue #76
**Title:** `[backend] Add health check endpoint`
**Labels:** `good first issue` `backend` `api`

**Description:**
Implement `healthCheckHandler()` and add a `GET /health` route.

**What to implement:**
- Test DB connectivity with `db.$queryRaw(Prisma.sql\`SELECT 1\`)`.
- Return `200` with `{ "status": "ok", "db": "connected" }` if healthy.
- Return `503` with `{ "status": "degraded", "db": "disconnected" }` if DB is unreachable.

**Acceptance Criteria:**
- [ ] Returns 200 when DB is connected.
- [ ] Returns 503 when DB is disconnected.
- [ ] Does not require authentication.
- [ ] Unit test mocking DB connectivity.

---

### Issue #77
**Title:** `[backend] Set up structured logging with Pino`
**Labels:** `good first issue` `backend`

**Description:**
Configure Pino logger and use it throughout the backend.

**What to implement:**
- Create `backend/src/logger.ts` that exports a configured Pino instance.
- Include fields: `timestamp`, `level`, `service: "boxmeout-backend"`.
- Use `pino-pretty` in development, raw JSON in production (check `NODE_ENV`).
- Replace all `console.log` calls in services and controllers with `logger.info()`, `logger.error()`, etc.
- Add request logging middleware using `pino-http`.

**Acceptance Criteria:**
- [ ] `npm run dev` shows pretty-printed logs.
- [ ] `NODE_ENV=production npm start` outputs raw JSON logs.
- [ ] All service functions use `logger` not `console.log`.
- [ ] HTTP requests logged with method, path, status code, and duration.

---

### Issue #78
**Title:** `[backend] Write integration tests for market API endpoints`
**Labels:** `backend` `testing` `advanced`

**Description:**
Write integration tests for all market API endpoints using Supertest and a real test database.

**What to cover:**
- `GET /api/markets` — empty DB, with data, with filters, with pagination
- `GET /api/markets/:id` — found and not found
- `GET /api/markets/:id/stats` — with seeded bets
- `GET /api/admin/markets/pending` — with seeded Locked markets

**What to set up:**
- Test database seeding/cleanup using Prisma in `beforeEach` / `afterEach`.
- Supertest app instance from `src/app.ts`.

**Acceptance Criteria:**
- [ ] All endpoints return correct status codes and response bodies.
- [ ] Tests are isolated (no shared state between test cases).
- [ ] `npm test` passes in CI with a test PostgreSQL database.

---

### Issue #79
**Title:** `[backend] Write integration tests for bet API endpoints`
**Labels:** `backend` `testing` `intermediate`

**Description:**
Write integration tests for bet endpoints.

**What to cover:**
- `GET /api/bets/:address` — with and without bets, with filters
- `GET /api/bets/:address/portfolio` — empty portfolio and with data
- `GET /api/bets/payout-estimate` — valid inputs, invalid inputs, rate limiting

**Acceptance Criteria:**
- [ ] All tests pass.
- [ ] Portfolio stats match seeded data exactly.
- [ ] Rate limit test hits the 429 response.

---

### Issue #80
**Title:** `[backend] Add Stellar Testnet environment configuration docs`
**Labels:** `good first issue` `backend` `devops`

**Description:**
Make it easy for new contributors to run the backend against Stellar Testnet.

**What to do:**
- Expand `.env.example` with comments explaining every variable.
- Create `docs/backend-setup.md` with step-by-step instructions: install deps, create Testnet account, fund with Friendbot, deploy contracts, fill `.env`, run migrations, start server.
- Add a "Testnet Quick Start" section to the root `README.md`.

**Acceptance Criteria:**
- [ ] A new contributor with zero prior knowledge can follow the guide and have the backend running against Testnet within 30 minutes.
- [ ] Every `.env.example` variable has an inline comment explaining what it is and where to get the value.
- [ ] Guide reviewed and confirmed working by at least one maintainer.

---

## FRONTEND ISSUES (81–120)

---

### Issue #81
**Title:** `[frontend] Set up Next.js 14 project with TypeScript and Tailwind`
**Labels:** `good first issue` `frontend`

**Description:**
Initialize the `/frontend` workspace.

**What to set up:**
- `tsconfig.json` with `strict: true`, path alias `@/*` pointing to `./`.
- Tailwind CSS configured with `tailwind.config.ts` and `app/globals.css`.
- ESLint with `next/core-web-vitals` config.
- `jest.config.ts` + `jest.setup.ts` for React Testing Library.
- Root layout `app/layout.tsx` with HTML shell, global font, and Toast provider.

**Acceptance Criteria:**
- [ ] `npm run dev` starts and shows a blank page without errors.
- [ ] `npm run build` compiles without errors or type errors.
- [ ] `npm run lint` passes.
- [ ] `npm test` runs (no tests yet, config works).
- [ ] Tailwind classes render correctly in the browser.

---

### Issue #82
**Title:** `[frontend] Implement useMarkets() hook`
**Labels:** `good first issue` `frontend` `hooks`

**Description:**
Implement `useMarkets()` in `frontend/hooks/useMarkets.ts`.

**What to implement:**
- Call `fetchMarkets(filters)` from `lib/api.ts` on mount.
- Store result in state: `{ markets, isLoading, error }`.
- `refetch()` function that re-triggers the fetch.
- Auto-refresh every 30 seconds using `setInterval` in a `useEffect`. Clear the interval on unmount.

**Acceptance Criteria:**
- [ ] `markets` populated after successful fetch.
- [ ] `isLoading` is true during fetch, false after.
- [ ] `error` set if fetch fails (network error, non-200 response).
- [ ] `refetch()` triggers a new fetch immediately.
- [ ] Interval cleared on unmount (no memory leak).
- [ ] Unit test with MSW mocking the API.

---

### Issue #83
**Title:** `[frontend] Implement useMarket() hook`
**Labels:** `good first issue` `frontend` `hooks`

**Description:**
Implement `useMarket(market_id)` in `frontend/hooks/useMarket.ts`.

**What to implement:**
- Fetch single market on mount.
- Poll every 10 seconds for live odds updates.
- Return `{ market, isLoading, error, refetch }`.

**Acceptance Criteria:**
- [ ] Returns market after successful fetch.
- [ ] Polls every 10 seconds.
- [ ] Handles 404 response: `market = null`, `error` set.
- [ ] Interval cleared on unmount.
- [ ] Unit test with MSW.

---

### Issue #84
**Title:** `[frontend] Implement useWallet() hook`
**Labels:** `frontend` `intermediate` `hooks`

**Description:**
Implement `useWallet()` in `frontend/hooks/useWallet.ts` using the Freighter API.

**What to implement:**
- `connect()`: calls `@stellar/freighter-api` `requestAccess()`, stores returned address in state and `localStorage`.
- `disconnect()`: clears state and `localStorage`.
- `signTransaction(xdr)`: calls `signTransaction()` from Freighter API.
- On mount, check `localStorage` for a saved address and restore the connected state.
- Handle the case where Freighter is not installed: `connect()` should throw `"Freighter wallet not found. Please install the browser extension."`.

**Acceptance Criteria:**
- [ ] Address stored and restored across page reloads.
- [ ] Freighter not installed → `connect()` throws descriptive error.
- [ ] `disconnect()` clears address from state and localStorage.
- [ ] `signTransaction()` returns signed XDR string.
- [ ] Unit test mocking Freighter API.

---

### Issue #85
**Title:** `[frontend] Implement usePlaceBet() hook`
**Labels:** `frontend` `advanced` `hooks`

**Description:**
Implement `usePlaceBet(market_id)` in `frontend/hooks/usePlaceBet.ts`.

**What to implement:**
- `placeBet(side, amount)`:
  1. Call `buildSorobanInvocation()` from `lib/stellar.ts` for `place_bet(bettor, side, amount)`.
  2. Call `wallet.signTransaction(xdr)`.
  3. Call `submitTransaction(signedXdr)` from `lib/stellar.ts`.
  4. Wait for confirmation and return the confirmed `Bet` object (fetch from `/api/bets/:address`).
- Manage `isLoading` and `error` state around the flow.

**Acceptance Criteria:**
- [ ] Full flow works against Stellar Testnet.
- [ ] `isLoading` true during transaction, false after.
- [ ] Error captured if wallet rejects signing.
- [ ] Error captured if network submission fails.
- [ ] Unit test mocking `stellar.ts` and `useWallet`.

---

### Issue #86
**Title:** `[frontend] Implement useClaimWinnings() hook`
**Labels:** `frontend` `advanced` `hooks`

**Description:**
Implement `useClaimWinnings()` in `frontend/hooks/useClaimWinnings.ts`.

**What to implement:**
- `claim(bet_id, market_id)`:
  1. Fetch the bet and market to determine the correct claim function: `claim_winnings` vs `claim_refund`.
  2. Build the appropriate Soroban invocation.
  3. Sign via wallet and submit.
  4. Return `ClaimReceipt` on success.

**Acceptance Criteria:**
- [ ] Calls `claim_winnings` for winning bets on Resolved markets.
- [ ] Calls `claim_refund` for bets on Cancelled markets.
- [ ] Works end-to-end against Testnet.
- [ ] Error state set on wallet rejection.

---

### Issue #87
**Title:** `[frontend] Implement usePortfolio() hook`
**Labels:** `frontend` `intermediate` `hooks`

**Description:**
Implement `usePortfolio(address)` in `frontend/hooks/usePortfolio.ts`.

**What to implement:**
- When `address` is `null`, return `{ bets: [], summary: null, isLoading: false }` — no network requests.
- When `address` is set, call `fetchBetsByAddress(address)` and `fetchPortfolioSummary(address)` in parallel.
- Return combined results.
- `refetch()` re-triggers both calls.

**Acceptance Criteria:**
- [ ] No network request when address is null.
- [ ] Both API calls made in parallel when address is set.
- [ ] Handles partial failure (one call fails, other succeeds).
- [ ] Unit test with MSW.

---

### Issue #88
**Title:** `[frontend] Implement usePayoutEstimate() hook`
**Labels:** `frontend` `intermediate` `hooks`

**Description:**
Implement `usePayoutEstimate(market_id, side, amount)` in `frontend/hooks/usePayoutEstimate.ts`.

**What to implement:**
- Debounce inputs by 300ms before calling the API.
- Call `fetchPayoutEstimate()` only when `side !== null` AND `amount !== null` AND `amount > 0n`.
- Return `{ estimate: bigint | null, isLoading: boolean }`.
- `estimate = null` while loading or inputs are invalid.

**Acceptance Criteria:**
- [ ] API called only after 300ms of input stability.
- [ ] No API call when `side` is null or `amount` is 0.
- [ ] `estimate` updates after each valid debounced input change.
- [ ] Unit test verifying debounce behavior with fake timers.

---

### Issue #89
**Title:** `[frontend] Implement useCreateMarket() hook`
**Labels:** `frontend` `advanced` `hooks`

**Description:**
Implement `useCreateMarket()` in `frontend/hooks/useCreateMarket.ts`.

**What to implement:**
- `createMarket(data)`:
  1. Build `create_market()` Soroban invocation for the MarketFactory contract.
  2. Sign via wallet.
  3. Submit and wait for ledger confirmation.
  4. Return the new `market_id` decoded from the transaction result.

**Acceptance Criteria:**
- [ ] Works end-to-end against Testnet.
- [ ] Returns market_id as a hex string.
- [ ] Error state set on wallet rejection or submission failure.
- [ ] Unit test mocking stellar.ts.

---

### Issue #90
**Title:** `[frontend] Implement useToast() hook and context provider`
**Labels:** `good first issue` `frontend` `hooks`

**Description:**
Implement `useToast()` in `frontend/hooks/useToast.ts` with a React context provider.

**What to implement:**
- `ToastContext` with `showToast`, `dismissToast`, and `toasts` state.
- `ToastProvider` component that wraps the app in `app/layout.tsx`.
- `useToast()` hook that reads from the context.
- `showToast(message, type)` generates a unique ID and adds to `toasts` array.
- Each toast auto-calls `dismissToast(id)` after 5 seconds using `setTimeout`.
- `dismissToast(id)` removes the toast from the array.

**Acceptance Criteria:**
- [ ] `showToast("Success", "success")` adds a toast visible to the Toast component.
- [ ] Toast auto-dismissed after 5 seconds.
- [ ] Multiple toasts can be active simultaneously.
- [ ] No memory leaks (timeouts cleared on toast dismiss).
- [ ] Unit test for all behaviors.

---

### Issue #91
**Title:** `[frontend] Build MarketCard component`
**Labels:** `good first issue` `frontend` `components`

**Description:**
Implement `MarketCard` in `frontend/components/MarketCard.tsx`.

**What to render:**
- Fighter A vs Fighter B names in a VS layout.
- `MarketStatusBadge` showing current status.
- `CountdownTimer` showing time until fight (or "betting closes in" if Open).
- `MarketOddsBar` showing current pool split.
- Weight class and scheduled date.
- Entire card is a `<Link>` to `/markets/{id}`.

**Acceptance Criteria:**
- [ ] Renders correctly for all market statuses.
- [ ] Clicking navigates to `/markets/{id}`.
- [ ] Looks correct on mobile (375px) and desktop (1440px).
- [ ] Snapshot test passes.
- [ ] Storybook story added.

---

### Issue #92
**Title:** `[frontend] Build MarketList component`
**Labels:** `good first issue` `frontend` `components`

**Description:**
Implement `MarketList` in `frontend/components/MarketList.tsx`.

**What to render:**
- Responsive grid of `MarketCard` components (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
- When `isLoading=true`: show `<LoadingSkeleton variant="card" count={6} />`.
- When `markets.length === 0` (and not loading): show an empty state — e.g. "No markets found. Check back soon."

**Acceptance Criteria:**
- [ ] Grid layout correct at all breakpoints.
- [ ] Loading skeletons shown during load.
- [ ] Empty state shown when no markets.
- [ ] Snapshot tests for all three states (loading, empty, with data).

---

### Issue #93
**Title:** `[frontend] Build FighterCard component`
**Labels:** `good first issue` `frontend` `components`

**Description:**
Implement `FighterCard` in `frontend/components/FighterCard.tsx`.

**What to render:**
- Fighter name (large, bold).
- Record (e.g. "30-1-0").
- Nationality + weight class.
- Pool amount in XLM (formatted from stroops).
- Implied odds as a percentage (e.g. "62.5%").
- Background color based on `side` prop ("A" = blue tint, "B" = red tint).

**Acceptance Criteria:**
- [ ] All fields rendered correctly.
- [ ] Implied odds formatted to 1 decimal place.
- [ ] Pool amount shows "0 XLM" when poolAmount = 0.
- [ ] Snapshot test passes.
- [ ] Storybook story added.

---

### Issue #94
**Title:** `[frontend] Build BettingInterface component`
**Labels:** `frontend` `intermediate` `components`

**Description:**
Implement `BettingInterface` in `frontend/components/BettingInterface.tsx`.

**What to render:**
- Two fighter selection buttons (clicking selects the side — active state highlighted).
- `BetAmountInput` below the buttons.
- A "Place Bet" submit button.
- Transaction loading state while bet is in-flight.
- Entire component disabled when `market.status !== "Open"`.
- Shows "Connect wallet to bet" prompt if wallet not connected.

**Acceptance Criteria:**
- [ ] Selecting a side highlights the button.
- [ ] Submit disabled when no side selected or amount is 0.
- [ ] Loading state shown during transaction.
- [ ] Disabled when market not Open.
- [ ] Calls `onBetPlaced` with result on success.
- [ ] Snapshot test + interaction test.

---

### Issue #95
**Title:** `[frontend] Build BetAmountInput component`
**Labels:** `frontend` `intermediate` `components`

**Description:**
Implement `BetAmountInput` in `frontend/components/BetAmountInput.tsx`.

**What to render:**
- A number input with "XLM" suffix label.
- Inline error message below input when value is outside `[min, max]`.
- "Estimated payout: {value} XLM" shown below (or "—" when `estimatedPayout` is null).
- Quick-fill buttons: "10 XLM", "50 XLM", "100 XLM".

**Acceptance Criteria:**
- [ ] Error shown for out-of-range values.
- [ ] Error cleared when value comes back in range.
- [ ] Payout estimate displayed with 2 decimal places.
- [ ] Quick-fill buttons call `onChange` with correct XLM → stroops conversion.
- [ ] Snapshot test.

---

### Issue #96
**Title:** `[frontend] Build MarketOddsBar component`
**Labels:** `good first issue` `frontend` `components`

**Description:**
Implement `MarketOddsBar` in `frontend/components/MarketOddsBar.tsx`.

**What to render:**
- A horizontal bar divided proportionally between Fighter A (blue) and Fighter B (red).
- Fighter names and percentages labeled on each side.
- When `poolA === 0n && poolB === 0n`: show 50% / 50%.
- Smooth Tailwind-based CSS — no third-party chart library for this component.

**Acceptance Criteria:**
- [ ] Proportions correct for 80/20, 50/50, 100/0 splits.
- [ ] 50/50 shown when both pools are 0.
- [ ] Percentages always sum to 100.
- [ ] Renders at correct width on mobile.
- [ ] Snapshot test.

---

### Issue #97
**Title:** `[frontend] Build MarketOddsChart component`
**Labels:** `frontend` `intermediate` `components`

**Description:**
Implement `MarketOddsChart` in `frontend/components/MarketOddsChart.tsx` using Recharts.

**What to render:**
- A `LineChart` with two lines: Fighter A odds (blue) and Fighter B odds (red).
- X-axis: timestamps formatted as "HH:mm".
- Y-axis: 0–100% range.
- Tooltip showing exact odds at each data point.
- When `historicalOdds.length === 1`: render a single dot, not a line (no chart crash).
- When `historicalOdds.length === 0`: render a "No odds data yet" placeholder.

**Acceptance Criteria:**
- [ ] Two lines rendered correctly with correct colors.
- [ ] Single data point rendered without crash.
- [ ] Empty state placeholder shown.
- [ ] Tooltip shows correct values.
- [ ] Snapshot test.

---

### Issue #98
**Title:** `[frontend] Build MarketStatusBadge component`
**Labels:** `good first issue` `frontend` `components`

**Description:**
Implement `MarketStatusBadge` in `frontend/components/MarketStatusBadge.tsx`.

**Color mapping:**
- `Open` → green background
- `Locked` → yellow background
- `Resolved` → blue background
- `Disputed` → red background
- `Cancelled` → gray background

**What to render:**
- A small pill badge with the status text and matching background color.

**Acceptance Criteria:**
- [ ] Correct color for each of the 5 statuses.
- [ ] Text matches status label exactly.
- [ ] Snapshot test covering all 5 variants.
- [ ] Storybook story with all 5 variants.

---

### Issue #99
**Title:** `[frontend] Build ClaimButton component`
**Labels:** `frontend` `intermediate` `components`

**Description:**
Implement `ClaimButton` in `frontend/components/ClaimButton.tsx`.

**Logic:**
- If `market.status === "Resolved"` AND `bet.side` matches `market.outcome` AND `!bet.claimed` → show "Claim Winnings" button.
- If `market.status === "Cancelled"` AND `!bet.claimed` → show "Claim Refund" button.
- If `bet.claimed` → show "Claimed ✓" (disabled, green).
- Otherwise → render nothing.

**What to implement:**
- Button click calls `useClaimWinnings().claim(bet_id, market_id)`.
- Shows loading spinner while claim is in-flight.
- On success, calls `onClaimed(receipt)`.
- On error, shows inline error message.

**Acceptance Criteria:**
- [ ] Correct button text for each scenario.
- [ ] Nothing rendered for losing bets on resolved markets.
- [ ] Loading state shown during transaction.
- [ ] `onClaimed` called on success.
- [ ] Snapshot test for all states.

---

### Issue #100
**Title:** `[frontend] Build PortfolioTable component`
**Labels:** `frontend` `intermediate` `components`

**Description:**
Implement `PortfolioTable` in `frontend/components/PortfolioTable.tsx`.

**Columns:**
- Fight (Fighter A vs Fighter B — links to market detail)
- Side (FighterA / FighterB badge)
- Amount (XLM, formatted)
- Status (won / lost / pending / claimed badge)
- Payout (XLM if claimed, estimated if pending, "—" if lost)
- Action (`ClaimButton` if eligible)

**Features:**
- Sortable by Amount and Payout.
- Shows empty illustration when `bets.length === 0`.

**Acceptance Criteria:**
- [ ] All 6 columns rendered correctly.
- [ ] Sorting works for Amount and Payout columns.
- [ ] Empty state shown.
- [ ] ClaimButton shown in Action column where appropriate.
- [ ] Snapshot test.

---

### Issue #101
**Title:** `[frontend] Build CreateMarketForm component`
**Labels:** `frontend` `intermediate` `components`

**Description:**
Implement `CreateMarketForm` in `frontend/components/CreateMarketForm.tsx`.

**Fields:**
- Fighter A: Name, Record, Nationality, Weight Class
- Fighter B: Name, Record, Nationality, Weight Class
- Fight Date and Time (datetime-local input)
- Betting Closes At (datetime-local input)
- Oracle Address (text input with Stellar address format validation)

**Validation (inline, before submit):**
- All fields required.
- Fighter names at least 2 characters.
- Betting closes time must be before fight time.
- Oracle address must be a valid G... Stellar address.

**Acceptance Criteria:**
- [ ] All fields rendered.
- [ ] Inline errors shown per field on submit attempt.
- [ ] Submit button disabled while submission is in-flight.
- [ ] `onSubmit` called only when all validations pass.
- [ ] Snapshot test.

---

### Issue #102
**Title:** `[frontend] Build WalletConnectButton component`
**Labels:** `good first issue` `frontend` `components`

**Description:**
Implement `WalletConnectButton` in `frontend/components/WalletConnectButton.tsx`.

**States:**
- Not connected: "Connect Wallet" button.
- Connecting: "Connecting..." with spinner.
- Connected: truncated address (e.g. "GABCD...WXYZ") with a dropdown showing "Disconnect".
- Freighter not installed: "Install Freighter" button that links to the Freighter download page.

**Acceptance Criteria:**
- [ ] All four states render correctly.
- [ ] `onConnected` called with address on successful connect.
- [ ] Clicking "Disconnect" clears state.
- [ ] Snapshot test for all states.

---

### Issue #103
**Title:** `[frontend] Build DisputeModal component`
**Labels:** `frontend` `advanced` `components`

**Description:**
Implement `DisputeModal` in `frontend/components/DisputeModal.tsx`.

**What to render:**
- A modal overlay (portal rendered to `document.body`).
- Title: "Dispute This Result".
- Explanation text: "You can dispute this result within the dispute window."
- Textarea for reason (required, min 20 characters).
- "Submit Dispute" button.
- Loading state while on-chain tx is in-flight.

**Display logic:**
- Only show if `market.status === "Resolved"` AND current time < `resolvedAt + dispute_window_sec`.
- A "Dispute Result" trigger button on the market detail page opens the modal.

**Acceptance Criteria:**
- [ ] Modal rendered in portal.
- [ ] Not visible outside dispute window.
- [ ] Reason validation (min 20 chars) shown inline.
- [ ] `onDisputed()` called on success.
- [ ] Closes on backdrop click or Escape key.
- [ ] Snapshot test for open and closed states.

---

### Issue #104
**Title:** `[frontend] Build CountdownTimer component`
**Labels:** `good first issue` `frontend` `components`

**Description:**
Implement `CountdownTimer` in `frontend/components/CountdownTimer.tsx`.

**What to implement:**
- Calculate remaining seconds: `targetTimestamp - Date.now() / 1000`.
- Format as `HH:MM:SS` (pad with leading zeros).
- Update every second via `setInterval` in `useEffect`. Clear on unmount.
- When remaining time reaches 0, show the `label` text as "LIVE".

**Acceptance Criteria:**
- [ ] Counts down correctly from a future timestamp.
- [ ] Shows "LIVE" when target is reached.
- [ ] Handles already-past timestamps (shows "LIVE" immediately).
- [ ] No `setInterval` leak on unmount.
- [ ] Unit test with fake timers.

---

### Issue #105
**Title:** `[frontend] Build LoadingSkeleton component`
**Labels:** `good first issue` `frontend` `components`

**Description:**
Implement `LoadingSkeleton` in `frontend/components/LoadingSkeleton.tsx`.

**Variants:**
- `"card"`: matches `MarketCard` dimensions — title bar, two fighter name placeholders, odds bar.
- `"table"`: matches `PortfolioTable` row — 6 column placeholders.
- `"chart"`: matches `MarketOddsChart` — rectangular placeholder with axis line.

Use Tailwind `animate-pulse` with gray background blocks. Accept `count` prop to render N skeletons.

**Acceptance Criteria:**
- [ ] All three variants rendered without errors.
- [ ] `count=3` renders 3 skeletons.
- [ ] Dimensions approximately match the real components.
- [ ] Snapshot test for all three variants.

---

### Issue #106
**Title:** `[frontend] Build Toast component`
**Labels:** `good first issue` `frontend` `components`

**Description:**
Implement `Toast` in `frontend/components/Toast.tsx`.

**What to render:**
- A small notification card positioned fixed bottom-right.
- Color-coded left border: success=green, error=red, info=blue.
- Icon matching type (checkmark / X / info).
- Message text.
- Close button (X) in top-right corner.

**Note:** The parent `ToastProvider` from `useToast()` is responsible for rendering multiple toasts and positioning them in a stack. This component renders a single toast.

**Acceptance Criteria:**
- [ ] All three type variants render with correct colors and icons.
- [ ] Close button calls `onDismiss(id)`.
- [ ] Snapshot test for all three types.
- [ ] Storybook stories for all three types.

---

### Issue #107
**Title:** `[frontend] Build Home page`
**Labels:** `frontend` `intermediate`

**Description:**
Implement `app/page.tsx` — the main landing page.

**What to render:**
- Hero section: "BOXMEOUT — Bet on Boxing" headline with a brief description.
- Filter tabs: "Active" (Open + Locked) | "Upcoming" (Open) | "Resolved".
- `MarketList` below the tabs, filtered by the active tab.
- Server-side initial data load for faster first paint.
- Client-side tab switching re-fetches with the new filter.

**Acceptance Criteria:**
- [ ] Initial data loaded server-side (no loading flash on first visit).
- [ ] Tab switching updates the market list.
- [ ] "Active" tab shown by default.
- [ ] Looks correct at all breakpoints.
- [ ] Manual test in browser.

---

### Issue #108
**Title:** `[frontend] Build Market Detail page`
**Labels:** `frontend` `intermediate`

**Description:**
Implement `app/markets/[id]/page.tsx`.

**Layout:**
- Top: Market title (Fighter A vs Fighter B) + `MarketStatusBadge` + `CountdownTimer`.
- Middle: Two `FighterCard` components side by side.
- Middle: `MarketOddsBar`.
- Below: `MarketOddsChart` (odds history).
- Right panel (or below on mobile): `BettingInterface`.
- Bottom: Bet history table for this market (public, not just the user).
- If market is Resolved and within dispute window: "Dispute Result" button opening `DisputeModal`.

**Acceptance Criteria:**
- [ ] All sections rendered with real data.
- [ ] `BettingInterface` is disabled when market not Open.
- [ ] Odds update every 10 seconds (via `useMarket()` hook polling).
- [ ] DisputeModal only visible in the dispute window.
- [ ] Responsive layout for mobile.
- [ ] Manual test in browser.

---

### Issue #109
**Title:** `[frontend] Build Create Market page`
**Labels:** `frontend` `intermediate`

**Description:**
Implement `app/create/page.tsx`.

**What to implement:**
- Check if wallet is connected via `useWallet()`. If not, show a "Connect wallet to create a market" prompt with `WalletConnectButton`.
- If connected, render `CreateMarketForm`.
- On form submit, call `useCreateMarket().createMarket(data)`.
- On success, show a success toast and navigate to `/markets/{new_market_id}`.
- On error, show an error toast with the error message.

**Acceptance Criteria:**
- [ ] Wallet prompt shown when not connected.
- [ ] Form shown when connected.
- [ ] Successful creation navigates to new market page.
- [ ] Error toast shown on failure.
- [ ] Manual test in browser.

---

### Issue #110
**Title:** `[frontend] Build Portfolio page`
**Labels:** `frontend` `intermediate`

**Description:**
Implement `app/portfolio/page.tsx`.

**What to implement:**
- Check if wallet is connected. If not, show `WalletConnectButton`.
- If connected, use `usePortfolio(address)` to fetch data.
- Render summary stats at the top: Total Staked, Total Winnings, Pending Claims, ROI.
- Render `PortfolioTable` below.
- Show loading skeletons while fetching.

**Acceptance Criteria:**
- [ ] Wallet prompt shown when not connected.
- [ ] Summary stats match API data.
- [ ] `PortfolioTable` rendered with correct bets.
- [ ] Loading state shows skeletons.
- [ ] Responsive layout.
- [ ] Manual test in browser.

---

### Issue #111
**Title:** `[frontend] Implement all API client functions in lib/api.ts`
**Labels:** `frontend` `intermediate`

**Description:**
Implement all 8 functions in `frontend/lib/api.ts`.

**What to implement for each:**
- Construct the correct URL with `NEXT_PUBLIC_API_URL` env var as base.
- Call `fetch()` with appropriate headers.
- Check response status — throw a typed `ApiError` for non-2xx responses.
- Parse and return the typed JSON response.
- For BigInt fields (amounts), parse string → BigInt in the response mapper.

**Acceptance Criteria:**
- [ ] All 8 functions implemented and typed correctly.
- [ ] Non-2xx responses throw `ApiError` with status code and message.
- [ ] BigInt amounts correctly handled.
- [ ] Unit tests with MSW mocking all endpoints.

---

### Issue #112
**Title:** `[frontend] Implement Soroban transaction utilities in lib/stellar.ts`
**Labels:** `frontend` `advanced`

**Description:**
Implement all 6 functions in `frontend/lib/stellar.ts`.

**What to implement:**
- `buildSorobanInvocation()`: use `@stellar/stellar-sdk` to build a `Transaction` with a `InvokeHostFunctionOp`, simulate via Soroban RPC, and return the prepared XDR.
- `submitTransaction()`: submit via `stellar-sdk` `Server.submitTransaction()`, poll for result.
- `decodeScVal()`: use `stellar-sdk` `scValToNative()` as the core and handle edge cases.
- `stroopsToXlm()`: divide by `10_000_000n`, format to up to 7 decimal places.
- `xlmToStroops()`: multiply by `10_000_000n`, handle fractional inputs.
- `truncateAddress()`: first 6 + "..." + last 4 chars.

**Acceptance Criteria:**
- [ ] `stroopsToXlm(10_000_000n) === "1"`.
- [ ] `xlmToStroops("1.5") === 15_000_000n`.
- [ ] `truncateAddress("GABCDEFGHI...WXYZ")` returns `"GABCDE...WXYZ"`.
- [ ] `buildSorobanInvocation()` produces valid XDR (verified against Testnet simulation).
- [ ] Unit tests for pure functions; integration test for Soroban calls against Testnet.

---

### Issue #113
**Title:** `[frontend] Handle Freighter wallet not installed gracefully`
**Labels:** `good first issue` `frontend`

**Description:**
When a user clicks "Connect Wallet" and Freighter is not installed, show a helpful message instead of an unhandled error.

**What to implement:**
- In `useWallet().connect()`, catch the "no wallet found" error from `@stellar/freighter-api`.
- Set a specific `walletNotInstalled: boolean` state.
- In `WalletConnectButton`, render a message with a link to the Freighter install page when `walletNotInstalled === true`.

**Acceptance Criteria:**
- [ ] No uncaught exception when Freighter is not installed.
- [ ] User sees "Install Freighter" button linking to the extension store.
- [ ] Unit test with Freighter API mocked as not available.

---

### Issue #114
**Title:** `[frontend] Add market filtering UI on Home page`
**Labels:** `frontend` `intermediate`

**Description:**
Add a filter bar above the market list on the Home page.

**Filters:**
- Status tabs: "All" | "Open" | "Locked" | "Resolved"
- Weight class dropdown: populated from the distinct weight classes in the fetched markets.

**Behavior:**
- Selecting a filter updates the `useMarkets()` hook parameters.
- URL query params updated to reflect filter state (for shareable links): `/?status=Open&weightClass=Heavyweight`.
- On page load, read query params and pre-select the correct filters.

**Acceptance Criteria:**
- [ ] Filter tabs update market list.
- [ ] Weight class dropdown populated from fetched markets.
- [ ] URL updated on filter change.
- [ ] Page loaded with `?status=Open` pre-selects the Open tab.
- [ ] Manual test in browser.

---

### Issue #115
**Title:** `[frontend] Implement responsive layout for mobile (375px+)`
**Labels:** `frontend` `intermediate`

**Description:**
Audit and fix the layout of all pages for screens >= 375px wide.

**What to check and fix:**
- Home page: grid switches to 1 column on mobile.
- Market Detail page: FighterCards stack vertically, BettingInterface full-width below chart.
- Portfolio page: PortfolioTable scrolls horizontally on small screens.
- Navigation bar collapses to hamburger menu on mobile.
- No horizontal scroll on any page at 375px.

**Acceptance Criteria:**
- [ ] All pages usable at 375px width.
- [ ] No horizontal scroll.
- [ ] All interactive elements (buttons, inputs) are at least 44px touch target.
- [ ] Manual test using browser DevTools at iPhone SE dimensions.

---

### Issue #116
**Title:** `[frontend] Add transaction pending state to betting UI`
**Labels:** `frontend` `intermediate`

**Description:**
Improve the BettingInterface UX to clearly communicate that a transaction is in progress.

**What to implement:**
- While `usePlaceBet().isLoading` is true:
  - Disable all inputs and buttons.
  - Show "Confirming transaction..." text with a spinner.
  - Show a progress toast: "Transaction submitted. Waiting for ledger confirmation...".
- On success: show success toast, call `onBetPlaced`, reset form.
- On error: show error toast with the error message, re-enable form.

**Acceptance Criteria:**
- [ ] Form disabled during in-flight transaction.
- [ ] Pending toast shown while waiting.
- [ ] Cannot double-submit while pending.
- [ ] Success and error toasts shown appropriately.
- [ ] Manual test in browser.

---

### Issue #117
**Title:** `[frontend] Write unit tests for all hooks`
**Labels:** `frontend` `testing` `advanced`

**Description:**
Write unit tests for all 10 hooks in `frontend/hooks/`.

**Testing setup:**
- Use React Testing Library `renderHook` + MSW for API mocking.
- Use `jest.useFakeTimers()` for interval/debounce tests.

**Cover for each hook:**
- Happy path (data returned correctly).
- Error path (API failure, error state set).
- Specific edge cases (null address for `usePortfolio`, debounce for `usePayoutEstimate`, etc.).

**Acceptance Criteria:**
- [ ] `npm test` passes with 0 failures.
- [ ] Every hook has at least 3 test cases.
- [ ] No real HTTP calls in tests (all mocked via MSW).
- [ ] Interval/timer cleanup verified by checking `clearInterval` / `clearTimeout` called.

---

### Issue #118
**Title:** `[frontend] Write component tests for MarketCard and FighterCard`
**Labels:** `frontend` `testing` `intermediate`

**Description:**
Write component tests for the two most critical display components.

**For `MarketCard`:**
- Renders fighter names correctly.
- Snapshot test.
- Clicking the card navigates to `/markets/{id}`.
- All `MarketStatus` variants render the correct `MarketStatusBadge`.

**For `FighterCard`:**
- Renders all fighter fields.
- Snapshot test.
- Pool amount of `0n` shows "0 XLM".
- Odds formatted to 1 decimal place.

**Acceptance Criteria:**
- [ ] All test cases pass.
- [ ] Snapshot tests committed and kept up to date.
- [ ] Tests use `@testing-library/react` — no Enzyme.

---

### Issue #119
**Title:** `[frontend] Add SEO metadata to all pages`
**Labels:** `good first issue` `frontend`

**Description:**
Use the Next.js 14 Metadata API to add SEO and OG tags to all pages.

**What to add for each page:**

- `app/page.tsx`: title "BOXMEOUT — Boxing Prediction Market", description "Bet on boxing matches with XLM on Stellar."
- `app/markets/[id]/page.tsx`: dynamic title "{FighterA} vs {FighterB} | BOXMEOUT", description with fight date.
- `app/create/page.tsx`: title "Create Market | BOXMEOUT".
- `app/portfolio/page.tsx`: title "My Portfolio | BOXMEOUT".

All pages: add `og:title`, `og:description`, `og:type` Open Graph tags.

**Acceptance Criteria:**
- [ ] Each page has a unique `<title>` and `<meta name="description">`.
- [ ] Market detail page has the fighter names in the title.
- [ ] Open Graph tags present on all pages.
- [ ] Verified in browser DevTools (Elements > head).

---

### Issue #120
**Title:** `[frontend] Set up Storybook for component development`
**Labels:** `frontend` `devops` `intermediate`

**Description:**
Configure Storybook 8 for Next.js and add stories for all reusable components.

**What to do:**
- Run `npx storybook init` in `/frontend`.
- Configure `addon-essentials`, `addon-a11y`, `addon-interactions`.
- Write at least one story per component (17 components total).
- Stories use realistic mock data matching API types.

**Required stories per component:**
- `MarketCard` — Open, Locked, Resolved states.
- `FighterCard` — FighterA side, FighterB side.
- `MarketStatusBadge` — all 5 status variants.
- `BettingInterface` — Open market, Locked market (disabled).
- `ClaimButton` — Claim Winnings, Claim Refund, Already Claimed states.
- `Toast` — success, error, info.
- All remaining components — at least 1 story each.

**Acceptance Criteria:**
- [ ] `npm run storybook` starts without errors.
- [ ] All 17 components have at least 1 story.
- [ ] Stories render correctly with mock data.
- [ ] No TypeScript errors in story files.
