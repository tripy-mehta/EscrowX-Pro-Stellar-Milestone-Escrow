#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol, Vec};

#[contracttype]
#[derive(Clone)]
pub struct Milestone {
    pub title: String,
    pub amount: i128,
    pub approved: bool,
    pub released: bool,
    pub auto_release_ledger: u32,
}

#[contracttype]
#[derive(Clone)]
pub struct Job {
    pub client: Address,
    pub freelancer: Address,
    pub funded: i128,
    pub milestones: Vec<Milestone>,
    pub disputed: bool,
}

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    pub fn create_job(env: Env, job_id: Symbol, client: Address, freelancer: Address, milestones: Vec<Milestone>) {
        client.require_auth();
        let job = Job {
            client: client.clone(),
            freelancer,
            funded: 0,
            milestones,
            disputed: false,
        };
        env.storage().persistent().set(&job_id, &job);
        env.events().publish((symbol_short!("job_new"), job_id), client);
    }

    pub fn deposit_funds(env: Env, job_id: Symbol, amount: i128) {
        let mut job: Job = env.storage().persistent().get(&job_id).expect("missing job");
        job.client.require_auth();
        job.funded += amount;
        env.storage().persistent().set(&job_id, &job);
        env.events().publish((symbol_short!("funded"), job_id), amount);
    }

    pub fn approve_milestone(env: Env, job_id: Symbol, index: u32) {
        let mut job: Job = env.storage().persistent().get(&job_id).expect("missing job");
        job.client.require_auth();
        let mut milestone = job.milestones.get(index).expect("missing milestone");
        milestone.approved = true;
        job.milestones.set(index, milestone);
        env.storage().persistent().set(&job_id, &job);
        env.events().publish((symbol_short!("approved"), job_id), index);
    }

    pub fn release_payment(env: Env, job_id: Symbol, index: u32) {
        let mut job: Job = env.storage().persistent().get(&job_id).expect("missing job");
        let mut milestone = job.milestones.get(index).expect("missing milestone");
        if !milestone.approved && env.ledger().sequence() < milestone.auto_release_ledger {
            panic!("not approved or expired");
        }
        if job.funded < milestone.amount {
            panic!("insufficient funds");
        }
        milestone.released = true;
        job.funded -= milestone.amount;
        job.milestones.set(index, milestone.clone());
        env.storage().persistent().set(&job_id, &job);
        env.events().publish((symbol_short!("released"), job_id), milestone.amount);
    }

    pub fn cancel_job(env: Env, job_id: Symbol) {
        let job: Job = env.storage().persistent().get(&job_id).expect("missing job");
        job.client.require_auth();
        env.storage().persistent().remove(&job_id);
        env.events().publish((symbol_short!("cancel"), job_id), job.client);
    }
}
