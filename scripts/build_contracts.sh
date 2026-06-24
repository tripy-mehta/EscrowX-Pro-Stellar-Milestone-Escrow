#!/bin/bash

# Ensure we're in the right directory
cd "$(dirname "$0")/../contracts" || exit 1

echo "Building Escrow Contract..."
cargo build --target wasm32-unknown-unknown --release -p escrow-contract

echo "Building Dispute Contract..."
cargo build --target wasm32-unknown-unknown --release -p dispute-contract

echo "Building Reputation Contract..."
cargo build --target wasm32-unknown-unknown --release -p reputation-contract

echo "Optimizing WASM files..."
# Create out dir
mkdir -p target/wasm32-unknown-unknown/release/optimized

# We use standard soroban build optimization if CLI is installed
if command -v soroban &> /dev/null
then
    soroban contract optimize --wasm target/wasm32-unknown-unknown/release/escrow_contract.wasm --wasm-out target/wasm32-unknown-unknown/release/optimized/escrow.wasm
    soroban contract optimize --wasm target/wasm32-unknown-unknown/release/dispute_contract.wasm --wasm-out target/wasm32-unknown-unknown/release/optimized/dispute.wasm
    soroban contract optimize --wasm target/wasm32-unknown-unknown/release/reputation_contract.wasm --wasm-out target/wasm32-unknown-unknown/release/optimized/reputation.wasm
    echo "Done! Optimized contracts are in contracts/target/wasm32-unknown-unknown/release/optimized/"
else
    echo "soroban-cli not found. Skipping optimization. Standard WASMs are in contracts/target/wasm32-unknown-unknown/release/"
fi
