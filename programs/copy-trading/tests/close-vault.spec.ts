import * as anchor from '@coral-xyz/anchor';
import {createInvestorWithBalance, createVault, depositToVault} from './helpers';

describe('Close Vault Instruction', () => {
  it('should close vault', async () => {
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
    expect(vaultAccount.operator.toString()).toEqual(
      operator.publicKey.toString(),
    );

    expect(vaultAccount.mint.toString()).toEqual(mintPubkey.toString());
    expect(vaultAccount.vaultBump).toEqual(vaultBump);
    expect(vaultAccount.mintBump).toEqual(mintBump);
    expect(vaultAccount.tokensIssued.toString()).toEqual('0');
    expect(vaultAccount.tokensBurnt.toString()).toEqual('0');
    expect(vaultAccount.solInTrade.toString()).toEqual('0');
    expect(vaultAccount.tokenPrice.toString()).toEqual('1000000');

    // close the account
    const tx = await program.methods
      .closeVault()
      .accounts({
        operator: operator.publicKey,
        vault: vaultPubkey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([operator])
      .rpc();

    // get balance at vault address
    const vaultBalance = await provider.connection.getBalance(vaultPubkey);

    // Assert the vault account has been closed
    expect(vaultBalance).toEqual(0);
  });

  it('should throw an error if the vault is not empty', async () => {
    // create vault
    const { provider, program, operator, vaultPubkey, mintPubkey } =
      await createVault();

    // create investor and airdrop some SOL
    const { investor } = await createInvestorWithBalance({ provider });

    // check initial balance for record
    const initialBalance = await provider.connection.getBalance(vaultPubkey);

    const depositAmount = 0.2;

    await depositToVault({
      program,
      operator,
      vaultPubkey,
      mintPubkey,
      investor,
      depositAmount,
    });

    // try to close the vault
    await expect(
      program.methods
        .closeVault()
        .accounts({
          operator: operator.publicKey,
          vault: vaultPubkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([operator])
        .rpc(),
    ).rejects.toThrow(/Vault is not empty/);
  })
});
