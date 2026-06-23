#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol};

#[contracttype]
#[derive(Clone)]
pub struct Dispute {
    pub job_id: Symbol,
    pub evidence_hash: String,
    pub votes_for_client: i128,
    pub votes_for_freelancer: i128,
    pub resolved: bool,
}

#[contract]
pub struct DisputeContract;

#[contractimpl]
impl DisputeContract {
    pub fn open_dispute(env: Env, dispute_id: Symbol, job_id: Symbol, opener: Address, evidence_hash: String) {
        opener.require_auth();
        let dispute = Dispute {
            job_id,
            evidence_hash: evidence_hash.clone(),
            votes_for_client: 0,
            votes_for_freelancer: 0,
            resolved: false,
        };
        env.storage().persistent().set(&dispute_id, &dispute);
        env.events().publish((symbol_short!("opened"), dispute_id), evidence_hash);
    }

    pub fn vote_resolution(env: Env, dispute_id: Symbol, arbiter: Address, vote_for_client: bool) {
        arbiter.require_auth();
        let mut dispute: Dispute = env.storage().persistent().get(&dispute_id).expect("missing dispute");
        if dispute.resolved {
            panic!("already resolved");
        }
        if vote_for_client {
            dispute.votes_for_client += 1;
        } else {
            dispute.votes_for_freelancer += 1;
        }
        env.storage().persistent().set(&dispute_id, &dispute);
        env.events().publish((symbol_short!("vote"), dispute_id), vote_for_client);
    }

    pub fn resolve_dispute(env: Env, dispute_id: Symbol) -> bool {
        let mut dispute: Dispute = env.storage().persistent().get(&dispute_id).expect("missing dispute");
        dispute.resolved = true;
        let client_wins = dispute.votes_for_client >= dispute.votes_for_freelancer;
        env.storage().persistent().set(&dispute_id, &dispute);
        env.events().publish((symbol_short!("resolved"), dispute_id), client_wins);
        client_wins
    }
}
