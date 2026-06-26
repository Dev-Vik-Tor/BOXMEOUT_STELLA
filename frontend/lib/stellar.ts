// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface SorobanInvokeParams {
  contractId: string;
  method: string;
  args: unknown[];
  signerAddress: string;
}

export interface TransactionResult {
  txHash: string;
  ledger: number;
  returnValue: unknown;
}

// ─── FUNCTIONS ────────────────────────────────────────────────────────────────

/**
 * Builds a Soroban contract invocation XDR string ready for wallet signing.
 * Fetches the current account sequence number from Horizon.
 * Simulates the transaction via Soroban RPC to populate the auth footprint.
 */
export async function buildSorobanInvocation(
  params: SorobanInvokeParams
): Promise<string> {
  throw new Error("Not implemented");
}

/**
 * Submits a signed XDR transaction to the Stellar network.
 * Polls for confirmation and returns the result once the transaction is in a ledger.
 * Throws a descriptive error on submission failure or timeout.
 */
export async function submitTransaction(signedXdr: string): Promise<TransactionResult> {
  throw new Error("Not implemented");
}

/**
 * Decodes a Soroban return value (ScVal) into a plain JavaScript value.
 * Handles i128, Bytes, Address, Vec, Map, and Option types.
 */
export function decodeScVal(scVal: unknown): unknown {
  throw new Error("Not implemented");
}

/**
 * Converts a XLM amount in stroops (bigint) to a human-readable string.
 * e.g. 10_000_000n -> "1 XLM"
 */
export function stroopsToXlm(stroops: bigint): string {
  throw new Error("Not implemented");
}

/**
 * Converts a human-readable XLM string to stroops (bigint).
 * e.g. "1.5" -> 15_000_000n
 */
export function xlmToStroops(xlm: string): bigint {
  throw new Error("Not implemented");
}

/**
 * Truncates a Stellar address for display.
 * e.g. "GABCDEF...WXYZ" (first 6 + last 4 chars)
 */
export function truncateAddress(address: string): string {
  throw new Error("Not implemented");
}
