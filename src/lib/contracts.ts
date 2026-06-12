import type { Address } from "viem";

/**
 * How a collection's tokens-by-owner are resolved (determined by the on-chain
 * probe in scripts/probe-collections.mjs):
 *
 *  - "enumerable": ERC721Enumerable — balanceOf + tokenOfOwnerByIndex loop.
 *  - "ownerSweep": bare ERC721 (no enumeration) — sweep ownerOf(1..totalSupply)
 *    via Multicall3, cache the {tokenId -> owner} map, filter by wallet.
 */
export type ReadStrategy = "enumerable" | "ownerSweep";

export type Collection = {
  key: string;
  name: string;
  symbol: string;
  address: Address;
  strategy: ReadStrategy;
  /** OpenSea collection slug, for outbound links. */
  openseaSlug: string;
};

export const COLLECTIONS: Collection[] = [
  {
    key: "comb",
    name: "comB",
    symbol: "COMB",
    address: "0xe14FEAb57A6B5DA65671176aDC1DB2f1a9c1bB48",
    strategy: "enumerable",
    openseaSlug: "comb-1062127",
  },
  {
    key: "bside",
    name: "B Side",
    symbol: "BSIDE",
    address: "0xfB497D7491aC6ec07a3f102d2C37F456B067bBe1",
    strategy: "ownerSweep",
    openseaSlug: "b-side-4",
  },
  {
    key: "bloomy",
    name: "Bloomy Tunes",
    symbol: "BLOOM",
    address: "0x77C7bcdf006C9c03A07D1a6ef225E70F696f5a91",
    strategy: "ownerSweep",
    openseaSlug: "bloomy-tunes",
  },
];

/**
 * IPFS gateway for resolving ipfs:// metadata + media. The collections are
 * pinned on Pinata, so default there. For production, set a *dedicated* Pinata
 * gateway via NEXT_PUBLIC_IPFS_GATEWAY — the shared one is heavily rate-limited.
 * NEXT_PUBLIC_ so the same value is used server-side (metadata) and client-side
 * (<img> src).
 */
export const IPFS_GATEWAY =
  process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/";

export function resolveIpfs(uri: string): string {
  return uri.startsWith("ipfs://")
    ? IPFS_GATEWAY + uri.slice("ipfs://".length)
    : uri;
}
