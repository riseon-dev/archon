use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct TradingPosition {
    pub operator: Pubkey,
    pub token_mint: Pubkey,
    pub token_amount: u64,
    pub sol_amount: u64,
    pub bump: u8,
}