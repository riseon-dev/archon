import * as anchor from '@coral-xyz/anchor';
import {createInvestorWithBalance, createVault, depositToVault} from './helpers';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';

describe('Create Claim Instruction', () => {
  it('should burn user tokens and create a claim account', async () => {
    // create vault
    const { provider, program, operator, vaultPubkey, mintPubkey } =
      await createVault();

    // create investor and airdrop some SOL
    const { investor }  = await createInvestorWithBalance({ provider });

    // deposit some SOL in vault, user receives tokens in ATA
    const depositAmount = 0.2;
    await depositToVault({
      program,
      operator,
      vaultPubkey,
      mintPubkey,
      investor,
      depositAmount,
    });

    // Calculate the claim public key
    const claimPubkey = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('claim'), vaultPubkey.toBuffer(), investor.publicKey.toBuffer()],
      program.programId,
    )[0]
    // Amount to claim - for this test, we'll claim all deposited tokens
    const claimAmount = new anchor.BN(depositAmount * anchor.web3.LAMPORTS_PER_SOL);

    // User's token account
    const userAta = getAssociatedTokenAddressSync(
      mintPubkey,
      investor.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    // rpc
    try {
      const tx = await program.methods
        .createClaim(claimAmount)
        .accounts({
          investor: investor.publicKey,
          operator: operator.publicKey,
          vault: vaultPubkey,
          claim: claimPubkey,
          mint: mintPubkey,
          user_ata: userAta,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([investor])
        .rpc();
    } catch (error) {
      console.error('Error creating claim:', error);
      if (error.getLogs) console.error(error.getLogs());
      throw error;
    }

    // expect claim account to exist
    // @ts-ignore
    const claimAccount = await program.account.investorClaim.fetch(claimPubkey);
    expect(claimAccount.investor.toString()).toEqual(investor.publicKey.toString());
    expect(claimAccount.tokenAmount.toString()).toEqual(claimAmount.toString());

    // expect user's tokens to be empty (burned)
    const userATA = getAssociatedTokenAddressSync(
      mintPubkey,
      investor.publicKey,
      false, // allowOwnerOffCurve parameter (optional)
      TOKEN_2022_PROGRAM_ID, // for spl-token-2022 specify it explicitly
    );
    const investorTokenAccountInfo =
      await provider.connection.getTokenAccountBalance(userATA);

    expect(investorTokenAccountInfo.value.amount.toString()).toEqual("0");

  });
});
