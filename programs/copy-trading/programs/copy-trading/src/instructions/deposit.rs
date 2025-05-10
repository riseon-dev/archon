pub use crate::constants::*;
use crate::vault::Vault;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
use anchor_spl::token::TokenAccount;
use anchor_spl::token_2022::Token2022;
use anchor_spl::token_interface::Mint;

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        owner = system_program::ID, // maybe not needed
    )]
    pub investor: Signer<'info>,

    #[account(mut)]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [b"mint", vault.key().as_ref()],
        bump = vault.mint_bump,
    )]
    pub mint: InterfaceAccount<'info, Mint>,
    
    #[account(
        mut,
        seeds = [b"vault", vault.key().as_ref()], // probably not correct
        bump = vault.vault_bump, // probably not correct
    )]
    pub mint_to: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
}
