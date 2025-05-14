use anchor_lang::prelude::*;
use anchor_lang::solana_program::rent::{
    DEFAULT_EXEMPTION_THRESHOLD, DEFAULT_LAMPORTS_PER_BYTE_YEAR,
};
use anchor_lang::system_program::{transfer, Transfer};

use anchor_spl::token_interface::{
    token_metadata_initialize, Mint, Token2022, TokenMetadataInitialize,
};
use spl_token_metadata_interface::state::TokenMetadata;
use spl_type_length_value::variable_len_pack::VariableLenPack;

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
      extensions::metadata_pointer::authority = vault,
      extensions::metadata_pointer::metadata_address = mint,
    )]
    pub mint: InterfaceAccount<'info, Mint>,
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

pub fn create_vault(
    ctx: Context<CreateVault>,
    token_name: String,
    token_symbol: String,
    token_uri: String,
) -> Result<()> {
    msg!(
        "Creating vault for operator {} with PDA {}",
        ctx.accounts.operator.key(),
        ctx.accounts.vault.key()
    );

    // PDA signer seeds
    let operator_key = ctx.accounts.operator.key();
    let seeds = &[b"vault", operator_key.as_ref(), &[ctx.bumps.vault]];
    let signer = &[&seeds[..]];

    let token_metadata = TokenMetadata {
        name: token_name.clone(),
        symbol: token_symbol.clone(),
        uri: token_uri.clone(),
        ..Default::default()
    };

    // Add 4 extra bytes for size of MetadataExtension (2 bytes for type, 2 bytes for length)
    let data_len = 4 + token_metadata.get_packed_len()?;

    // Calculate lamports required for the additional metadata
    let lamports =
        data_len as u64 * DEFAULT_LAMPORTS_PER_BYTE_YEAR * DEFAULT_EXEMPTION_THRESHOLD as u64;

    // Transfer additional lamports to mint account
    transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.operator.to_account_info(),
                to: ctx.accounts.mint.to_account_info(),
            },
        ),
        lamports,
    )?;

    // Initialize token metadata
    token_metadata_initialize(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TokenMetadataInitialize {
                token_program_id: ctx.accounts.token_program.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                metadata: ctx.accounts.mint.to_account_info(),
                mint_authority: ctx.accounts.vault.to_account_info(),
                update_authority: ctx.accounts.vault.to_account_info(),
            },
            signer,
        ),
        token_name,
        token_symbol,
        token_uri,
    )?;

    msg!("Token created successfully.");

    // Initialize the vault account
    ctx.accounts.vault.set_inner(Vault {
        operator: ctx.accounts.operator.key(),
        tokens_issued: 0,
        tokens_burnt: 0,
        sol_in_trade: 0,
        token_price: 1 * 10u64.pow(VAULT_TOKEN_PRICE_DECIMALS as u32),
        mint: ctx.accounts.mint.key(),
        vault_bump: ctx.bumps.vault,
        mint_bump: ctx.bumps.mint,
    });

    Ok(())
}
