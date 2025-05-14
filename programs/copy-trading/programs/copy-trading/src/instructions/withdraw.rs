pub use crate::constants::*;
use crate::error;
use crate::{InvestorClaim, Vault};
use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use anchor_spl::token_2022::Token2022;
use anchor_spl::token_interface::Mint;

// return sol to user, remove the claim account
#[derive(Accounts)]
pub struct Withdraw<'info> {
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
        close = investor,
        seeds = [b"claim", vault.key().as_ref(), investor.key().as_ref()],
        bump,
    )]
    pub claim: Account<'info, InvestorClaim>,

    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    msg!(
        "Withdrawing {} SOL from vault {}",
        amount,
        ctx.accounts.vault.key()
    );

    // Check whether the user has a claim account
    let claim_lamports: u64 = ctx.accounts.claim.get_lamports();
    if claim_lamports <= 0 {
        return err!(error::ErrorCode::NoClaimAccount);
    }

    // Check that the vault has enough lamports to withdraw
    let vault_info = ctx.accounts.vault.to_account_info();
    let vault_lamports = vault_info.lamports();
    if vault_lamports < amount {
        return err!(error::ErrorCode::InsufficientFunds);
    }

    // Transfer SOL by directly manipulating lamports instead of using system program
    **vault_info.try_borrow_mut_lamports()? -= amount;
    **ctx
        .accounts
        .investor
        .to_account_info()
        .try_borrow_mut_lamports()? += amount;

    // Close the claim account
    ctx.accounts
        .claim
        .close(ctx.accounts.investor.to_account_info())
}
