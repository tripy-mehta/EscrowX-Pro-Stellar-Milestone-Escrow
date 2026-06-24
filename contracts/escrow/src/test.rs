#![cfg(test)]

use super::*;
use soroban_sdk::{Env, testutils::Address as _, vec, symbol_short};

#[test]
fn test_escrow_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, EscrowContract);
    let client = EscrowContractClient::new(&env, &contract_id);

    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let job_id = symbol_short!("job1");

    let milestones = vec![
        &env,
        Milestone {
            title: String::from_str(&env, "M1"),
            amount: 100,
            approved: false,
            released: false,
            auto_release_ledger: 1000,
        },
    ];

    client.create_job(&job_id, &client_addr, &freelancer_addr, &milestones);
    client.deposit_funds(&job_id, &100);
    client.approve_milestone(&job_id, &0);
    client.release_payment(&job_id, &0);
}
