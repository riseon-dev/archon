import * as anchor from '@coral-xyz/anchor';
import { createVault } from './helpers';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';

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
        mint: mintPubkey,
        mintTo: getAssociatedTokenAddressSync(
          mintPubkey,
          investor.publicKey,
          false, // allowOwnerOffCurve parameter (optional)
          TOKEN_2022_PROGRAM_ID // Specify the token program explicitly
        ),
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([investor])
      .rpc();

    // check vault sol balance
    const currentBalance = await provider.connection.getBalance(vaultPubkey);
    expect(currentBalance).toEqual(initialBalance + depositAmount.toNumber());
  });

  it('should mint tokens to investor', async () => {
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

    // amount to deposit in vault
    const depositAmount = new anchor.BN(0.2 * anchor.web3.LAMPORTS_PER_SOL);

    console.log('>>>> here');
    try {
      const depositTx = await program.methods
        .deposit(depositAmount)
        .accounts({
          investor: investor.publicKey,
          operator: operator.publicKey,
          vault: vaultPubkey,
          mint: mintPubkey,
          mintTo: getAssociatedTokenAddressSync(
            mintPubkey,
            investor.publicKey,
            false, // allowOwnerOffCurve parameter (optional)
            TOKEN_2022_PROGRAM_ID // Specify the token program explicitly
          ),
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([investor])
        .rpc();
      console.log('Deposit Tx Signature', depositTx);
    } catch (error) {
      console.log('Error', error);
      if (error?.getLogs) console.log('Error', await error.getLogs());

      throw error;
    }

    // check investor token balance
    const investorTokenAccount = getAssociatedTokenAddressSync(
      mintPubkey,
      investor.publicKey,
    );
    console.log('investorTokenAccount', investorTokenAccount.toBase58());


  });


});
