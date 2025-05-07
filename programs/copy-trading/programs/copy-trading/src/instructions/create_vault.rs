use anchor_lang::prelude::*;
use anchor_spl::token_2022::{Token2022};
use anchor_spl::token_interface::{Mint,};

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
    pub mint: InterfaceAccount<'info, Mint>,
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

pub fn create_vault(ctx: Context<CreateVault>) -> Result<()> {
    msg!("Creating vault");
    msg!("Vault for operator {}", ctx.accounts.operator.key());
    msg!("Vault PDA {}", ctx.accounts.vault.key());

    // Initialize the vault account
    ctx.accounts.vault.set_inner(Vault {
        operator: ctx.accounts.operator.key(),
        tokens_issued: 0,
        tokens_burnt: 0,
        sol_in_trade: 0,
        token_price: 0,
        mint: ctx.accounts.mint.key(),
        vault_bump: ctx.bumps.vault,
        mint_bump: ctx.bumps.mint,
    });

    Ok(())
}
