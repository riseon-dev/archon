use anchor_lang::prelude::*;
use crate::error::ErrorCode;
use crate::Vault;

#[derive(Accounts)]
pub struct CloseVault<'info> {
    #[account(mut)]
    pub operator: Signer<'info>,

    #[account(
        mut,
        close = operator,
        seeds = [b"vault", operator.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, Vault>,

    pub system_program: Program<'info, System>,
}

pub fn close_vault(ctx: Context<CloseVault>) -> Result<()> {
    msg!(
        "Closing vault for operator {} with PDA {}",
        ctx.accounts.operator.key(),
        ctx.accounts.vault.key()
    );

    // check whether all the tokens have been withdrawn
    require_eq!(
        ctx.accounts.vault.tokens_issued,
        0,
        ErrorCode::VaultNotEmpty,
    );
    require_eq!(
        ctx.accounts.vault.sol_in_trade,
        0,
        ErrorCode::VaultNotEmpty,
    );
    require_eq!(
        ctx.accounts.vault.tokens_burnt,
        0,
        ErrorCode::VaultNotEmpty,
    );

    // Close the vault account and transfer the lamports to the operator
    ctx.accounts
        .vault
        .close(ctx.accounts.operator.to_account_info())
}
