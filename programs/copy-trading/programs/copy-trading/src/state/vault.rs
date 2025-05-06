use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub operator: Pubkey,
    pub uid: u8, // Note : this was name before, changed to uid
    pub tokens_issued: u64,
    pub tokens_burnt: u64,
    pub sol_in_trade: u64,
    pub token_price: u64,
    pub mint: Pubkey,
    pub bump: u8,
}