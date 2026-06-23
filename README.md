# EscrowX Pro+

Secure milestone-based freelance payments on Stellar with decentralized dispute resolution and reputation scoring.

EscrowX Pro+ is a production-shaped Stellar dApp for freelance work. Clients fund milestones, freelancers submit evidence, payments are released by approval or time-based auto-release, and disputes are resolved by evidence-backed voting. The frontend includes responsive screens for dashboard analytics, job creation, job details, dispute center, reputation profiles, live events, loading-friendly actions, and wallet state.

## Requirements covered

- Advanced smart contracts: escrow, reputation, and dispute contracts in `contracts/`.
- Inter-contract architecture: milestone release, rating updates, and dispute outcomes are modeled as separate contract responsibilities.
- Event streaming: Express + Socket.IO listener in `server/index.ts`.
- CI/CD: GitHub Actions workflow runs lint, frontend tests, build, and contract workflow checks.
- Deployment workflow: contract deployment notes in `contracts/README.md`.
- Mobile responsive UI: dashboard, create job, job details, dispute center, and reputation profile all adapt below tablet width.
- Error/loading-ready UX: wallet state, live toasts, status pills, and action feedback are implemented.
- Tests: frontend workflow tests and escrow engine tests.
- Production architecture: typed domain model, API listener, database schema, contract folders, and environment template.

## Tech stack

Frontend: React, TypeScript, Vite, React Query, Socket.IO Client, CSS.

Backend: Node.js, Express, Socket.IO.

Blockchain: Stellar Testnet, Soroban-style Rust contract sources.

Database: PostgreSQL schema in `db/schema.sql`.

DevOps: GitHub Actions, Vercel-ready frontend, Railway-ready backend.

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

Optional event listener:

```bash
npm run backend:dev
```

Run checks:

```bash
npm test
npm run build
npm run contract:test
```

## Demo flow

1. Connect wallet.
2. Open `Create Job` and create a milestone escrow.
3. Deposit 100 XLM from the hero action.
4. Open `Job Details`.
5. Approve a milestone and watch the real-time activity feed update.
6. Open a dispute with an IPFS evidence hash.
7. Submit mutual ratings and show the reputation profile score.

## Submission checklist

- Public GitHub repository: create repo and push this project.
- Minimum 10 meaningful commits: commit in stages such as scaffold, UI, contracts, backend, tests, CI, docs, deployment.
- Live demo link: deploy the Vite app to Vercel or Netlify.
- Contract deployment address: deploy contracts using `contracts/README.md`, then update `.env`.
- Transaction hash: include one successful testnet invocation hash in this README before submission.
- Screenshots: capture mobile UI, CI/CD run, and test output.
- Demo video: record the demo flow above in 1-2 minutes.

## Environment variables

See `.env.example`.

## Contract events

- Escrow: `job_created`, `funds_deposited`, `milestone_completed`, `payment_released`.
- Reputation: `rating_added`, `score_updated`.
- Dispute: `dispute_opened`, `vote_cast`, `dispute_resolved`.
