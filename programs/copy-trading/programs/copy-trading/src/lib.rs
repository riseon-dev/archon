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
        let vault_amount = sol_amount * ctx.accounts.vault.token_price.checked_div(1 * 10u64.pow
        (VAULT_TOKEN_PRICE_DECIMALS as u32)).unwrap();

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

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        // TODO check whether there is SOL balance

        // calculate sol amount from token price
        // not using checked_div here to avoid panic while withdrawing
        let token_price = ctx.accounts.vault.token_price / (1 * 10u64.pow(VAULT_TOKEN_PRICE_DECIMALS as u32));
        let sol_amount = ctx.accounts.claim.token_amount * token_price;

        // remove value from tokens burnt
        ctx.accounts.vault.tokens_burnt -= ctx.accounts.claim.token_amount;

        // transfer sol to user
        instructions::withdraw(ctx, sol_amount)
    }

    pub fn swap_from_sol(
        ctx: Context<SwapFromSol>,
        sol_amount: u64,
        other_amount_threshold: u64,
        sqrt_price_limit: u128,
        amount_specified_is_input: bool,
        a_to_b: bool,
    ) -> Result<()> {
        // step 1 create a trading position
        ctx.accounts.trading_position.set_inner( TradingPosition {
            operator: ctx.accounts.operator.key(),
            token_vault_a: ctx.accounts.token_vault_a.key(),
            token_vault_b: ctx.accounts.token_vault_b.key(),
            token_amount: other_amount_threshold,
            bump: ctx.bumps.trading_position,
            sol_amount,
        });

        // step 2 add to sol_in_trade
        ctx.accounts.vault.sol_in_trade += sol_amount;

        // step 3 do the swap
        instructions::swap_from_sol(
            ctx,
            sol_amount,
            other_amount_threshold,
            sqrt_price_limit,
            amount_specified_is_input,
            a_to_b,
        )
    }

    pub fn swap_to_sol(
        ctx: Context<SwapToSol>,
        amount: u64,
        sol_amount_threshold: u64,
        sqrt_price_limit: u128,
        amount_specified_is_input: bool,
        a_to_b: bool,
    ) -> Result<()> {
        let original_sol_amount = ctx.accounts.trading_position.sol_amount;

        // step 1 close trading position
        ctx.accounts.trading_position.close(ctx.accounts.operator.to_account_info())?;

        // step 2 remove from sol_in_trade
        ctx.accounts.vault.sol_in_trade -= original_sol_amount;

        // step 3 do profit calculation
        ctx.accounts.vault.token_price = calculate_new_price(
            ctx.accounts.trading_position.sol_amount,
            ctx.accounts.vault.sol_in_trade,
            ctx.accounts.vault.token_price,
        )?;

        // step 4 do the swap
        instructions::swap_to_sol(
            ctx,
            amount,
            sol_amount_threshold,
            sqrt_price_limit,
            amount_specified_is_input,
            a_to_b,
        )
    }
}


pub fn calculate_new_price(
    current_sol_amount: u64,
    original_sol_amount: u64,
    old_price: u64,
) -> Result<u64> {
    // Calculate the new price based on the formula


    Ok(old_price)
}