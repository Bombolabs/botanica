// Probe Berachain NFT contracts to determine how to enumerate a wallet's tokens.
// Run: node scripts/probe-collections.mjs
import { ethers } from "ethers";

const RPC = process.env.RPC_URL || "https://rpc.berachain.com";

const ADDRESSES = [
  "0xfB497D7491aC6ec07a3f102d2C37F456B067bBe1",
  "0xe14FEAb57A6B5DA65671176aDC1DB2f1a9c1bB48",
  "0x77C7bcdf006C9c03A07D1a6ef225E70F696f5a91",
];

// A wallet that almost certainly holds nothing — used to test whether
// owner-enumeration functions EXIST (they should return [] / 0, not revert).
const PROBE_WALLET = "0x000000000000000000000000000000000000dEaD";

const IFACE = {
  ERC721: "0x80ac58cd",
  ERC721Metadata: "0x5b5e139f",
  ERC721Enumerable: "0x780e9d63",
  ERC1155: "0xd9b67a26",
};

const ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function supportsInterface(bytes4) view returns (bool)",
  "function tokenURI(uint256) view returns (string)",
  "function balanceOf(address) view returns (uint256)",
  "function tokenOfOwnerByIndex(address,uint256) view returns (uint256)",
  "function tokensOfOwner(address) view returns (uint256[])", // ERC721AQueryable
];

const provider = new ethers.JsonRpcProvider(RPC);

async function tryCall(fn) {
  try {
    return { ok: true, value: await fn() };
  } catch (e) {
    return { ok: false, error: e.shortMessage || e.message };
  }
}

async function supports(c, id) {
  const r = await tryCall(() => c.supportsInterface(id));
  return r.ok ? r.value : false;
}

async function probe(addr) {
  console.log("\n" + "=".repeat(70));
  console.log("CONTRACT:", addr);

  const code = await provider.getCode(addr);
  if (code === "0x") {
    console.log("  ⚠️  No contract code at this address on this chain.");
    return;
  }

  const c = new ethers.Contract(addr, ABI, provider);

  const name = await tryCall(() => c.name());
  const symbol = await tryCall(() => c.symbol());
  const total = await tryCall(() => c.totalSupply());
  console.log("  name:        ", name.ok ? name.value : "(none)");
  console.log("  symbol:      ", symbol.ok ? symbol.value : "(none)");
  console.log("  totalSupply: ", total.ok ? total.value.toString() : "(none)");

  // ERC165 interface advertisements
  const is721 = await supports(c, IFACE.ERC721);
  const isMeta = await supports(c, IFACE.ERC721Metadata);
  const isEnum = await supports(c, IFACE.ERC721Enumerable);
  const is1155 = await supports(c, IFACE.ERC1155);
  console.log("  ERC165 says: ", {
    ERC721: is721,
    Metadata: isMeta,
    Enumerable: isEnum,
    ERC1155: is1155,
  });

  // Functional probes for owner-enumeration helpers
  const tOO = await tryCall(() => c.tokensOfOwner(PROBE_WALLET));
  const tOBI = await tryCall(() => c.tokenOfOwnerByIndex(PROBE_WALLET, 0)); // reverts on empty too, so judge by error type

  const hasTokensOfOwner = tOO.ok;
  // tokenOfOwnerByIndex on an empty wallet reverts with an index error, which still
  // proves the function EXISTS. A missing function reverts differently (no data).
  const hasOwnerByIndex =
    tOBI.ok ||
    (tOBI.error &&
      /out of bounds|index|owner index|ERC721|revert/i.test(tOBI.error) &&
      !/no data|missing revert|could not decode|function selector/i.test(tOBI.error));

  // Sample metadata
  const uri =
    total.ok && total.value > 0n
      ? await tryCall(() => c.tokenURI(total.value > 1n ? 1n : 0n))
      : { ok: false, error: "no supply to sample" };

  console.log("  --- enumeration ---");
  console.log("  tokensOfOwner(addr)      :", hasTokensOfOwner ? "✅ YES (single-call, best)" : "❌ no");
  console.log("  tokenOfOwnerByIndex      :", hasOwnerByIndex ? "✅ YES (Enumerable, loop)" : "❌ no");
  console.log("  sample tokenURI          :", uri.ok ? uri.value : `(${uri.error})`);

  // Verdict
  let verdict;
  if (hasTokensOfOwner) verdict = "RPC ONLY — call tokensOfOwner(wallet)";
  else if (hasOwnerByIndex || isEnum) verdict = "RPC ONLY — balanceOf + tokenOfOwnerByIndex loop (Multicall3)";
  else verdict = "⚠️ NEEDS INDEXER — only balanceOf/ownerOf; index Transfer events";
  console.log("  >>> DATA-LAYER VERDICT:", verdict);
}

(async () => {
  const net = await provider.getNetwork();
  console.log("RPC:", RPC, "| chainId:", net.chainId.toString());
  for (const a of ADDRESSES) await probe(a);
  console.log("\n" + "=".repeat(70));
  console.log("Done.");
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
