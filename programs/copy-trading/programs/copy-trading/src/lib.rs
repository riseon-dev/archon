use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use error::ErrorCode;
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
        let vault_amount = sol_amount
            * ctx
                .accounts
                .vault
                .token_price
                .checked_div(1 * 10u64.pow(VAULT_TOKEN_PRICE_DECIMALS as u32))
                .unwrap();

        // Update tokens_issued supply
        ctx.accounts.vault.tokens_issued += vault_amount;

        // mint vault tokens
        instructions::mint_vault_tokens(&mut ctx, vault_amount)
    }

    pub fn create_claim(ctx: Context<CreateClaim>, amount: u64) -> Result<()> {
        // increase tokens burnt
        ctx.accounts.vault.tokens_burnt += amount;

        // decrease the tokens issued supply
        ctx.accounts.vault.tokens_issued -= amount;

        // create a claim account for user
        instructions::create_claim(ctx, amount)
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        // calculate sol amount from token price
        let token_price = ctx
            .accounts
            .vault
            .token_price
            .checked_div(1 * 10u64.pow(VAULT_TOKEN_PRICE_DECIMALS as u32))
            .unwrap();
        let sol_amount = ctx.accounts.claim.token_amount * token_price;

        // check if vault has enough sol balance
        let vault_balance = ctx.accounts.vault.to_account_info().lamports();
        require_gt!(vault_balance, sol_amount, ErrorCode::InsufficientSOLBalance);

        // remove value from tokens burnt
        ctx.accounts.vault.tokens_burnt -= ctx.accounts.claim.token_amount;

        // transfer sol to user
        instructions::withdraw(ctx, sol_amount)
    }

    pub fn close_vault(ctx: Context<CloseVault>) -> Result<()> {
        instructions::close_vault(ctx)
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
        ctx.accounts.trading_position.set_inner(TradingPosition {
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
        ctx.accounts
            .trading_position
            .close(ctx.accounts.operator.to_account_info())?;

        // step 2 remove from sol_in_trade
        ctx.accounts.vault.sol_in_trade -= original_sol_amount;

        // get sol balance from vault
        let vault_balance = ctx.accounts.vault.to_account_info().lamports();
        let new_sol_amount = vault_balance - original_sol_amount + sol_amount_threshold;

        // step 3 do profit calculation
        ctx.accounts.vault.token_price = calculate_new_token_price(
            original_sol_amount,
            new_sol_amount,
            ctx.accounts.vault.tokens_issued,
            ctx.accounts.vault.token_price,
        );

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

// Function to calculate the new token price based on SOL supply change
pub fn calculate_new_token_price(
    old_sol_supply: u64,
    new_sol_supply: u64,
    token_supply: u64,
    current_token_price: u64,
) -> u64 {
    // Calculate the total value in the vault using the old supply and current price
    let total_value = old_sol_supply.checked_mul(current_token_price).unwrap_or(0);

    // Calculate the new token price to maintain the same total value
    // with the new SOL supply
    let new_token_price = if token_supply > 0 {
        // Use checked operations to prevent overflow/underflow
        total_value
            .checked_mul(new_sol_supply)
            .unwrap_or(0)
            .checked_div(old_sol_supply.checked_mul(token_supply).unwrap_or(1))
            .unwrap_or(current_token_price)
    } else {
        current_token_price // Avoid division by zero
    };

    new_token_price
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn calculate_token_price_test_proportional_increase() {
        // Initial: 100 SOL, 100 tokens, price 100 (1:1)
        // New SOL supply is 20% higher
        assert_eq!(calculate_new_token_price(100, 120, 100, 100), 120);
    }

    #[test]
    fn calculate_token_price_test_proportional_decrease() {
        // Initial: 100 SOL, 100 tokens, price 100
        // New SOL supply is 20% lower
        assert_eq!(calculate_new_token_price(100, 80, 100, 100), 80);
    }

    #[test]
    fn calculate_token_price_test_zero_token_supply() {
        // Should return the current price when token supply is zero (to avoid division by zero)
        assert_eq!(calculate_new_token_price(100, 120, 0, 100), 100);
    }

    #[test]
    fn calculate_token_price_test_zero_old_sol_supply() {
        // Edge case: should handle zero old SOL supply gracefully
        assert_eq!(calculate_new_token_price(0, 100, 100, 50), 50); // Should return current price
    }
}
