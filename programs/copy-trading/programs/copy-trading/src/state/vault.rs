use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub operator: Pubkey,

    // token info
    pub tokens_issued: u64,
    pub tokens_burnt: u64,

    // trade info
    pub sol_in_trade: u64,
    pub token_price: u64,

    // mint info
    pub mint: Pubkey,
    pub vault_bump: u8,
    pub mint_bump: u8,
}
