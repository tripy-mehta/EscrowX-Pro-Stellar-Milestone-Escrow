#![cfg(test)]

use super::*;
use soroban_sdk::{Env, testutils::Address as _, symbol_short};

#[test]
fn test_dispute_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, DisputeContract);
    let client = DisputeContractClient::new(&env, &contract_id);

    let user_addr = Address::generate(&env);
    let arbiter_addr = Address::generate(&env);
    let dispute_id = symbol_short!("d1");
    let job_id = symbol_short!("j1");

    client.open_dispute(&dispute_id, &job_id, &user_addr, &String::from_str(&env, "bafyHash"));
    client.vote_resolution(&dispute_id, &arbiter_addr, &true);
    let client_wins = client.resolve_dispute(&dispute_id);

    assert_eq!(client_wins, true);
}
