"use client";

import { useQuery } from "@tanstack/react-query";

type Item = {
  tokenId: string;
  name: string;
  image: string | null;
  tokenURI: string;
};

type CollectionItems = {
  key: string;
  name: string;
  symbol: string;
  address: string;
  openseaSlug: string;
  count: number;
  items: Item[];
};

type ItemsResponse = { address: string; collections: CollectionItems[] };

async function fetchItems(): Promise<ItemsResponse> {
  const res = await fetch("/api/items");
  if (!res.ok) throw new Error(`items request failed (${res.status})`);
  return res.json();
}

export function ItemsGrid() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["items"],
    queryFn: fetchItems,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-10">
        {[0, 1, 2].map((i) => (
          <CollectionSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-red-500/30 p-6 text-sm">
        <p>Couldn’t load your items.</p>
        <button
          onClick={() => refetch()}
          className="mt-3 rounded border border-black/20 px-3 py-1 text-xs hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {data.collections.map((c) => (
        <CollectionSection key={c.key} c={c} />
      ))}
      {isFetching && (
        <p className="text-xs text-black/40 dark:text-white/40">Refreshing…</p>
      )}
    </div>
  );
}

function CollectionSection({ c }: { c: CollectionItems }) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-medium">
          {c.name}{" "}
          <span className="text-sm font-normal text-black/40 dark:text-white/40">
            ({c.count})
          </span>
        </h2>
        <a
          href={`https://opensea.io/collection/${c.openseaSlug}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs underline underline-offset-4 opacity-60 hover:opacity-100"
        >
          OpenSea ↗
        </a>
      </div>

      {c.items.length === 0 ? (
        <p className="text-sm text-black/40 dark:text-white/40">
          No {c.name} items in this wallet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {c.items.map((item) => (
            <ItemCard key={item.tokenId} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function ItemCard({ item }: { item: Item }) {
  return (
    <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/15">
      <div className="aspect-square bg-black/5 dark:bg-white/5">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-black/30 dark:text-white/30">
            no image
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium">{item.name}</p>
      </div>
    </div>
  );
}

function CollectionSkeleton() {
  return (
    <section>
      <div className="mb-4 h-5 w-32 animate-pulse rounded bg-black/10 dark:bg-white/10" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="aspect-square animate-pulse rounded-xl bg-black/5 dark:bg-white/5"
          />
        ))}
      </div>
    </section>
  );
}
