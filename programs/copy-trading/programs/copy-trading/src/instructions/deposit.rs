pub use crate::constants::*;
use crate::vault::Vault;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
use anchor_lang::system_program::{transfer, Transfer};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{mint_to, MintTo, Token2022},
    token_interface::{Mint, TokenAccount},
};

#[derive(Accounts)]
#[instruction(sol_amount: u64)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,
    /// CHECK: operator's account is passed for vault bump purposes
    pub operator: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"vault", operator.key().as_ref()],
        bump = vault.vault_bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        address = vault.mint,
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        init_if_needed,
        payer = investor,
        associated_token::mint = mint,
        associated_token::authority = investor,
        associated_token::token_program = token_program,
    )]
    pub mint_to: InterfaceAccount<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// NOTE: this function is fine, no need to change
pub fn deposit_sol(ctx: &mut Context<Deposit>, amount: u64) -> Result<()> {
    msg!(
        "Depositing {} SOL into vault {}",
        amount,
        ctx.accounts.vault.key()
    );

    // Transfer SOL from the investor to the vault
    let cpi_accounts = Transfer {
        from: ctx.accounts.investor.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.system_program.to_account_info(), cpi_accounts);
    transfer(cpi_ctx, amount)?;

    Ok(())
}

pub fn mint_vault_tokens(ctx: &mut Context<Deposit>, amount: u64) -> Result<()> {
    msg!(
        "Minting {} tokens to investor's ATA {}",
        amount,
        ctx.accounts.mint_to.key(), // investor's associated token account
    );

    // PDA signer seeds
    let operator_key = ctx.accounts.operator.key();
    let seeds = &[
        b"vault",
        operator_key.as_ref(),
        &[ctx.accounts.vault.vault_bump],
    ];
    let signer = &[&seeds[..]];

    // Mint tokens to the investor
    let cpi_accounts = MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.mint_to.to_account_info(),
        authority: ctx.accounts.vault.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer,
    );

    mint_to(cpi_ctx, amount)
}
