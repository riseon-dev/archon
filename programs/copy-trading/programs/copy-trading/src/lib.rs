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
        instructions::create_vault(ctx)
    }
}
