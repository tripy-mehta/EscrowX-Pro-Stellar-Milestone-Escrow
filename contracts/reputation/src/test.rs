#![cfg(test)]

use super::*;
use soroban_sdk::{Env, testutils::Address as _};

#[test]
fn test_reputation_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, ReputationContract);
    let client = ReputationContractClient::new(&env, &contract_id);

    let user_addr = Address::generate(&env);

    client.submit_rating(&user_addr, &5, &true, &false);
    
    let score = client.get_user_score(&user_addr);
    assert_eq!(score, 101); // 5 * 20 / 1 + 1 - 0 = 101
}
