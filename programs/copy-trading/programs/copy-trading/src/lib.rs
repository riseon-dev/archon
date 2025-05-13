use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("8NMw7pjvKbBe3bNRmxtKidth4LcZT8249Eo2LxVbRvt9");

#[program]
pub mod copy_trading {
    use super::*;

    pub fn create_vault(ctx: Context<CreateVault>) -> Result<()> {
        instructions::create_vault(
            ctx,
            "Test".to_string(),
            "TEST".to_string(),
            "https://example.com".to_string(),
        )
    }

    pub fn deposit(mut ctx: Context<Deposit>, sol_amount: u64) -> Result<()> {
        // deposit
        instructions::deposit_sol(&mut ctx, sol_amount)?;

        // calculate vault amount based on sol amount here
        let vault_amount = sol_amount * ctx.accounts.vault.token_price;

        // Update the vault state
        ctx.accounts.vault.tokens_issued += vault_amount;

        // mint vault tokens
        instructions::mint_vault_tokens(&mut ctx, vault_amount)
    }

    pub fn create_claim(ctx: Context<CreateClaim>, amount: u64) -> Result<()> {
        // increase tokens burnt
        ctx.accounts.vault.tokens_burnt += amount;

        // create a claim account for user
        instructions::create_claim(ctx, amount)
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        // calculate sol amount from token price
        let sol_amount = amount * ctx.accounts.vault.token_price;

        // remove value from tokens burnt
        ctx.accounts.vault.tokens_burnt -= amount;

        // transfer sol to user
        instructions::withdraw(ctx, sol_amount)
    }
}
