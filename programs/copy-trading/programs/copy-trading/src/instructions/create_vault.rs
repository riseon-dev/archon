use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, TokenAccount, Token};
use anchor_spl::token_interface::{TokenInterface};
use anchor_lang::{prelude::*, AnchorDeserialize, AnchorSerialize};
use anchor_spl::{
    metadata::{
        create_metadata_accounts_v3, mpl_token_metadata::types::DataV2, CreateMetadataAccountsV3,
        Metadata as Metaplex,
    },
};

use crate::vault::Vault;
pub use crate::constants::*;

#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub struct InitTokenParams {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub decimals: u8,
}

#[derive(Accounts)]
#[instruction(params: InitTokenParams, uid: u8)]
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

    #[account(mut)]
    /// CHECK: unsafe metdata
    pub metadata: UncheckedAccount<'info>,

    #[account(
      init,
      seeds = [b"mint"],
      payer = operator,
      bump,
      mint::decimals = params.decimals,
      mint::authority = mint,
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
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_metadata_program: Program<'info, Metaplex>,
    pub rent: Sysvar<'info, Rent>,
}


pub fn create_vault(
    ctx: Context<CreateVault>,
    params: InitTokenParams,
    uid: u8,
) -> Result<()> {
    msg!("Creating vault");
    msg!("Vault UID: {} for operator {}", uid, ctx.accounts.operator.key());

    let seeds = &["mint".as_bytes(), &[ctx.bumps.mint]];
    let signer = [&seeds[..]];

    let token_data: DataV2 = DataV2 {
        name: params.name,
        symbol: params.symbol,
        uri: params.uri,
        seller_fee_basis_points: 0,
        creators: None,
        collection: None,
        uses: None,
    };

    let cpi_program = ctx.accounts.token_metadata_program.to_account_info();
    let account_metadata: CreateMetadataAccountsV3 = CreateMetadataAccountsV3 {
        payer: ctx.accounts.operator.to_account_info(),
        update_authority: ctx.accounts.mint.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        metadata: ctx.accounts.metadata.to_account_info(),
        mint_authority: ctx.accounts.mint.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
    };

    let metadata_ctx = CpiContext::new_with_signer(cpi_program, account_metadata, &signer);

    create_metadata_accounts_v3(metadata_ctx, token_data, false, true, None)?;

    // Initialize the vault account
    ctx.accounts.vault.set_inner(Vault {
        operator: ctx.accounts.operator.key(),
        uid: uid,
        tokens_issued: 0,
        tokens_burnt: 0,
        sol_in_trade: 0,
        token_price: 0,
        mint: ctx.accounts.mint.key(),
        bump: ctx.bumps.vault,
    });
 
    Ok(())
}
