use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, TokenAccount, };
use anchor_spl::token_interface::{TokenInterface};

use crate::vault::Vault;
pub use crate::constants::*;

#[derive(Accounts)]
#[instruction(uid: u8)]
pub struct CreateVault<'info> {
    #[account(mut)]
    pub operator: Signer<'info>,

    #[account(
        init,
        payer = operator,
        space = DISCRIMINATOR + Vault::INIT_SPACE,
        seeds = [b"vault", operator.key().as_ref(), uid.to_le_bytes().as_ref()],
        bump,
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(
      mint::token_program = token_program,
      mint::authority = vault,
    )]
    pub mint: Account<'info, Mint>,
    
    #[account(
      init_if_needed,
      payer = operator,
      associated_token::mint = mint,
      associated_token::authority = operator,
    )]
    pub mint_ata: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> CreateVault<'info> {
    pub fn create_vault(
        &mut self,
        uid: &u8,
        bumps: &CreateVaultBumps,
    ) -> Result<()> {
        msg!("Creating vault");
        msg!("Vault UID: {} for operator {}", uid, self.operator.key());

        // Initialize the vault account
        self.vault.set_inner(Vault {
            operator: self.operator.key(),
            uid: *uid,
            tokens_issued: 0,
            tokens_burnt: 0,
            sol_in_trade: 0,
            token_price: 0,
            mint: self.mint.key(),
            mint_ata: self.mint_ata.key(),
            bump: bumps.vault,
        });
     
        Ok(())
    }
}