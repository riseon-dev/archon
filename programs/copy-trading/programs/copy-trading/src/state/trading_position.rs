use anchor_lang::prelude::*;
use anchor_spl::token_interface::TokenAccount;

#[account]
#[derive(InitSpace)]
pub struct TradingPosition {
    pub operator: Pubkey,
    pub token_vault_a: Pubkey,
    pub token_vault_b: Pubkey,
    pub token_amount: u64,
    pub sol_amount: u64,
    pub bump: u8,
}
