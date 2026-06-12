import "server-only";
import type { Abi, Address } from "viem";
import { getAddress } from "viem";
import { publicClient } from "./viem-server";
import { COLLECTIONS, resolveIpfs, type Collection } from "./contracts";

const ERC721_ABI = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalSupply", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "ownerOf", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "address" }] },
  { type: "function", name: "tokenURI", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "string" }] },
  { type: "function", name: "tokenOfOwnerByIndex", stateMutability: "view", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "uint256" }] },
] as const satisfies Abi;

export type Item = {
  tokenId: string;
  name: string;
  image: string | null;
  tokenURI: string;
};

export type CollectionItems = Pick<
  Collection,
  "key" | "name" | "symbol" | "address" | "openseaSlug"
> & { count: number; items: Item[] };

// --- owner-sweep cache (for the bare-ERC721 Kingdomly collections) ----------
// {tokenId -> owner} map per collection, refreshed on a short TTL. Cheap because
// each collection is only ~956 tokens.
const SWEEP_TTL_MS = 60_000;
const sweepCache = new Map<Address, { at: number; owners: Map<string, Address> }>();

async function getOwnerMap(address: Address): Promise<Map<string, Address>> {
  const cached = sweepCache.get(address);
  if (cached && Date.now() - cached.at < SWEEP_TTL_MS) return cached.owners;

  const total = (await publicClient.readContract({
    address,
    abi: ERC721_ABI,
    functionName: "totalSupply",
  })) as bigint;

  // Sweep ownerOf(1..total) in one batched Multicall3 call.
  const calls = Array.from({ length: Number(total) }, (_, i) => ({
    address,
    abi: ERC721_ABI,
    functionName: "ownerOf" as const,
    args: [BigInt(i + 1)],
  }));

  const results = await publicClient.multicall({ contracts: calls, allowFailure: true });

  const owners = new Map<string, Address>();
  results.forEach((r, i) => {
    if (r.status === "success" && r.result) {
      owners.set(String(i + 1), getAddress(r.result as Address));
    }
  });

  sweepCache.set(address, { at: Date.now(), owners });
  return owners;
}

// --- metadata cache (tokenURIs are immutable, so keep them long) ------------
const metaCache = new Map<string, { name: string; image: string | null }>();

async function fetchMeta(tokenURI: string): Promise<{ name: string; image: string | null }> {
  const cached = metaCache.get(tokenURI);
  if (cached) return cached;

  let meta = { name: "", image: null as string | null };
  try {
    const res = await fetch(resolveIpfs(tokenURI), { signal: AbortSignal.timeout(10_000) });
    if (res.ok) {
      const json = await res.json();
      meta = {
        name: typeof json.name === "string" ? json.name : "",
        image: typeof json.image === "string" ? resolveIpfs(json.image) : null,
      };
    }
  } catch {
    // Leave defaults; the UI falls back to "#tokenId" with no image.
  }
  metaCache.set(tokenURI, meta);
  return meta;
}

/** Map with bounded concurrency — keeps us under the IPFS gateway's rate limit. */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

/** Token IDs a wallet owns in a single collection. */
async function ownedTokenIds(c: Collection, owner: Address): Promise<bigint[]> {
  if (c.strategy === "enumerable") {
    const balance = (await publicClient.readContract({
      address: c.address,
      abi: ERC721_ABI,
      functionName: "balanceOf",
      args: [owner],
    })) as bigint;

    const calls = Array.from({ length: Number(balance) }, (_, i) => ({
      address: c.address,
      abi: ERC721_ABI,
      functionName: "tokenOfOwnerByIndex" as const,
      args: [owner, BigInt(i)],
    }));
    const res = await publicClient.multicall({ contracts: calls, allowFailure: true });
    return res.flatMap((r) => (r.status === "success" ? [r.result as bigint] : []));
  }

  // ownerSweep
  const owners = await getOwnerMap(c.address);
  const target = getAddress(owner);
  return [...owners.entries()]
    .filter(([, o]) => o === target)
    .map(([id]) => BigInt(id));
}

/** Resolve owned token IDs -> items with metadata for one collection. */
async function collectionItemsFor(c: Collection, owner: Address): Promise<CollectionItems> {
  const ids = await ownedTokenIds(c, owner);

  const uriRes = await publicClient.multicall({
    contracts: ids.map((id) => ({
      address: c.address,
      abi: ERC721_ABI,
      functionName: "tokenURI" as const,
      args: [id],
    })),
    allowFailure: true,
  });

  const items: Item[] = await mapLimit(ids, 8, async (id, i) => {
    const uri = uriRes[i].status === "success" ? (uriRes[i].result as string) : "";
    const meta = uri ? await fetchMeta(uri) : { name: "", image: null };
    return {
      tokenId: id.toString(),
      name: meta.name || `#${id.toString()}`,
      image: meta.image,
      tokenURI: uri,
    };
  });

  items.sort((a, b) => Number(BigInt(a.tokenId) - BigInt(b.tokenId)));

  return {
    key: c.key,
    name: c.name,
    symbol: c.symbol,
    address: c.address,
    openseaSlug: c.openseaSlug,
    count: items.length,
    items,
  };
}

/** All ecosystem items held by `owner`, grouped by collection. */
export async function getEcosystemItems(owner: Address): Promise<CollectionItems[]> {
  return Promise.all(COLLECTIONS.map((c) => collectionItemsFor(c, owner)));
}
