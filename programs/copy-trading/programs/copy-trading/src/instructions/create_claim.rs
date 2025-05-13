pub use crate::constants::*;
use crate::investor_claim::InvestorClaim;
use crate::vault::Vault;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_2022::{burn, Burn, Token2022};
use anchor_spl::token_interface::{Mint, TokenAccount};

#[derive(Accounts)]
pub struct CreateClaim<'info> {
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
        init_if_needed,
        seeds = [b"claim", vault.key().as_ref(), investor.key().as_ref()],
        bump,
        space = DISCRIMINATOR + InvestorClaim::INIT_SPACE,
        payer = investor,
    )]
    pub claim: Account<'info, InvestorClaim>,

    #[account(
        mut,
        address = vault.mint,
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = investor,
        associated_token::token_program = token_program,
    )]
    pub user_ata: InterfaceAccount<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn create_claim(ctx: Context<CreateClaim>, amount: u64) -> Result<()> {
    msg!(
        "Creating claim for {} in vault {}",
        ctx.accounts.investor.key(),
        ctx.accounts.vault.key()
    );

    // Initialize the claim account
    ctx.accounts.claim.set_inner(InvestorClaim {
        investor: ctx.accounts.investor.key(),
        token_amount: amount,
        bump: ctx.bumps.claim,
    });

    // burn user's tokens equivalent to amount
    let cpi_accounts = Burn {
        mint: ctx.accounts.mint.to_account_info(),
        from: ctx.accounts.user_ata.to_account_info(),
        authority: ctx.accounts.vault.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);

    burn(cpi_ctx, amount)
}
