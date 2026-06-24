#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol};

#[contracttype]
#[derive(Clone)]
pub struct Reputation {
    pub total_rating: i128,
    pub rating_count: i128,
    pub completed_jobs: i128,
    pub disputes_lost: i128,
}

#[contract]
pub struct ReputationContract;

#[contractimpl]
impl ReputationContract {
    pub fn submit_rating(env: Env, subject: Address, rating: i128, completed_job: bool, dispute_lost: bool) {
        if rating < 1 || rating > 5 {
            panic!("rating out of range");
        }
        let mut reputation = Self::get_rating(env.clone(), subject.clone());
        reputation.total_rating += rating;
        reputation.rating_count += 1;
        if completed_job {
            reputation.completed_jobs += 1;
        }
        if dispute_lost {
            reputation.disputes_lost += 1;
        }
        env.storage().persistent().set(&subject, &reputation);
        env.events().publish((symbol_short!("rating"), subject), rating);
    }

    pub fn get_rating(env: Env, subject: Address) -> Reputation {
        env.storage().persistent().get(&subject).unwrap_or(Reputation {
            total_rating: 0,
            rating_count: 0,
            completed_jobs: 0,
            disputes_lost: 0,
        })
    }

    pub fn get_user_score(env: Env, subject: Address) -> i128 {
        let reputation = Self::get_rating(env, subject);
        if reputation.rating_count == 0 {
            return 0;
        }
        let average = reputation.total_rating * 20 / reputation.rating_count;
        average + reputation.completed_jobs - reputation.disputes_lost * 8
    }
}

#[cfg(test)]
mod test;
