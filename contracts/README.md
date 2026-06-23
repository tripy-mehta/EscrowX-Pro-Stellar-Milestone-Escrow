# EscrowX Pro+ Soroban Contracts

This folder contains the three-contract architecture used by the app:

- `escrow`: milestone funding, approval, release, cancellation, and auto-release ledger checks.
- `reputation`: permanent user ratings and public score calculation.
- `dispute`: evidence hashes, arbiter voting, and resolution events.

## Deployment workflow

Install the Stellar CLI, configure testnet identity, then build and deploy each contract:

```bash
stellar contract build
stellar contract deploy --wasm target/wasm32-unknown-unknown/release/escrow.wasm --source alice --network testnet
stellar contract deploy --wasm target/wasm32-unknown-unknown/release/reputation.wasm --source alice --network testnet
stellar contract deploy --wasm target/wasm32-unknown-unknown/release/dispute.wasm --source alice --network testnet
```

Paste the resulting contract IDs into `.env`.
