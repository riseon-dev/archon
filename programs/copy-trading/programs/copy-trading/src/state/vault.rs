use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub operator: Pubkey,
    #[max_len(32)]
    pub name: String,
    pub tokens_issued: u64,
    pub tokens_burtn: u64,
    pub sol_in_trade: u64,
    pub token_price: u64,
    pub mint: Pubkey,
    pub bump: u8,
}