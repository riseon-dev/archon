use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient funds in vault for withdrawal")]
    InsufficientFunds,

    #[msg("Insufficient SOL balance in vault. Try again later.")]
    InsufficientSOLBalance,

    #[msg("User does not have a claim account")]
    NoClaimAccount,

    #[msg("Vault is not empty")]
    VaultNotEmpty,
}
