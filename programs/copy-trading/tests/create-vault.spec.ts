import * as anchor from '@coral-xyz/anchor';
import { createVault } from './helpers';
import { getMint, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';

describe('Create Vault Instruction', () => {
  it('should create vault', async () => {
    const {
      provider,
      program,
      operator,
      vaultPubkey,
      mintPubkey,
      vaultBump,
      mintBump,
    } = await createVault();

    // check vault state
    // @ts-ignore
    const vaultAccount = await program.account.vault.fetch(vaultPubkey);

    // Assert the vault account has the expected state
    expect(vaultAccount.operator.toString()).toEqual(operator.publicKey.toString());
    expect(vaultAccount.mint.toString()).toEqual(mintPubkey.toString());
    expect(vaultAccount.vaultBump).toEqual(vaultBump);
    expect(vaultAccount.mintBump).toEqual(mintBump);
    expect(vaultAccount.tokensIssued.toString()).toEqual('0');
    expect(vaultAccount.tokensBurnt.toString()).toEqual('0');
    expect(vaultAccount.solInTrade.toString()).toEqual('0');
    expect(vaultAccount.tokenPrice.toString()).toEqual('0');

    // Optionally verify the mint account exists
    const mintInfo = await provider.connection.getAccountInfo(mintPubkey);
    expect(mintInfo).toBeTruthy()

    const mintAccount = await getMint(
      provider.connection,
      mintPubkey,
      'confirmed',
      TOKEN_2022_PROGRAM_ID
    );

    expect(mintAccount.mintAuthority.toString()).toEqual(vaultPubkey.toString());
  });

  it.todo('should not allow closing of vault by non-operator');

  it.todo('should not allow closing vault if there are deposits');

  it.todo('should close vault');
});
