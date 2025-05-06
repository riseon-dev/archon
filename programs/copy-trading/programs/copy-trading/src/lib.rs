pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("2DHHZStK2bAjGEpbopuZsdaiJtxCCkzacUbeTQLmWrbh");

#[program]
pub mod copy_trading {
    use super::*;

    pub fn create_vault(
        ctx: Context<CreateVault>,
        uid: u8,
    ) -> Result<()> {
        ctx.accounts.create_vault(&uid, &ctx.bumps)
    }
}
