# Botanica Portal

Wallet-gated Next.js portal for viewing Botanica ecosystem items.

## Local Setup

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Fill the values in `.env.local` before using wallet login.

## Required Environment

- `NEXT_PUBLIC_WC_PROJECT_ID`: Reown/WalletConnect project id.
- `APP_HOST`: canonical host used for SIWE domain checks.
- `SESSION_PASSWORD`: random session secret, at least 32 characters.
- `BERACHAIN_RPC_URL`: Berachain RPC endpoint.
- `NEXT_PUBLIC_IPFS_GATEWAY`: IPFS gateway URL ending in `/ipfs/`.

## Verification

```bash
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
```

## Deployment

Pushes to `main` run GitHub Actions verification and then deploy over SSH when
these repository secrets are configured:

- `VPS_HOST`
- `VPS_PORT` optional, defaults to `22`
- `VPS_USER`
- `VPS_SSH_KEY`
- `DEPLOY_PATH`
- `DEPLOY_RESTART_COMMAND`

The remote deploy command fetches `origin/main`, resets the VPS checkout to it,
runs `npm ci`, runs `npm run build`, then executes `DEPLOY_RESTART_COMMAND`.
