use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct InvestorClaim {
    pub investor: Pubkey,
    pub token_amount: u64,
    pub bump: u8,
}
