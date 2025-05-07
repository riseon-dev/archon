use anchor_lang::prelude::*;
use anchor_lang::{prelude::*, AnchorDeserialize, AnchorSerialize};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{initialize_mint, InitializeMint, Mint, Token, TokenAccount};
use anchor_spl::token_interface::TokenInterface;

pub use crate::constants::*;
use crate::vault::Vault;

#[derive(Accounts)]
pub struct CreateVault<'info> {
    #[account(mut)]
    pub operator: Signer<'info>,

    #[account(
        init,
        payer = operator,
        space = DISCRIMINATOR + Vault::INIT_SPACE,
        seeds = [b"vault", operator.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
      init,
      seeds = [b"mint", vault.key().as_ref()],
      payer = operator,
      bump,
      mint::decimals = 6,
      mint::authority = vault,
      mint::freeze_authority = vault,
    )]
    pub mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn create_vault(ctx: Context<CreateVault>) -> Result<()> {
    msg!("Creating vault");
    msg!("Vault for operator {}", ctx.accounts.operator.key());
    let decimals: u8 = 6; // hard coded for now

    let operator_binding = ctx.accounts.operator.key();
    let vault_seeds = &[b"vault", operator_binding.as_ref()];
    let signer = [&vault_seeds[..]];

    // Initialize the mint
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = InitializeMint {
        mint: ctx.accounts.mint.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
    };

    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, &signer);
    initialize_mint(
        cpi_ctx,
        decimals,
        &ctx.accounts.vault.key(),
        Some(&ctx.accounts.vault.key()),
    )?;

    // Initialize the vault account
    ctx.accounts.vault.set_inner(Vault {
        operator: ctx.accounts.operator.key(),
        tokens_issued: 0,
        tokens_burnt: 0,
        sol_in_trade: 0,
        token_price: 0,
        mint: ctx.accounts.mint.key(),
        bump: ctx.bumps.vault,
    });

    Ok(())
}
