import * as anchor from '@coral-xyz/anchor';
import { createVault } from './helpers';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

describe('Deposit Instruction', () => {
  it('should allow deposits of sol', async () => {
    // create vault
    const { provider, program, operator, vaultPubkey, mintPubkey } =
      await createVault();

    // create investor and airdrop some SOL
    const investor = anchor.web3.Keypair.generate();
    const airdropSignature = await provider.connection.requestAirdrop(
      investor.publicKey,
      anchor.web3.LAMPORTS_PER_SOL * 2,
    );
    await provider.connection.confirmTransaction(airdropSignature);

    // check initial balance for record
    const initialBalance = await provider.connection.getBalance(vaultPubkey);

    // amount to deposit in vault
    const depositAmount = new anchor.BN(0.2 * anchor.web3.LAMPORTS_PER_SOL);

    const depositTx = await program.methods
      .deposit(depositAmount)
      .accounts({
        investor: investor.publicKey,
        operator: operator.publicKey,
        vault: vaultPubkey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([investor])
      .rpc();

    // check investor's ata balance
    const currentBalance = await provider.connection.getBalance(vaultPubkey);

    expect(currentBalance).toEqual(initialBalance + depositAmount.toNumber());
  });


});
