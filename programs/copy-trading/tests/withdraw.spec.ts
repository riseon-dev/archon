import {
  createClaim,
  createInvestorWithBalance,
  createVault,
  depositToVault,
} from './helpers';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import * as anchor from '@coral-xyz/anchor';

describe('Withdraw Instruction', () => {
  it('should transfer SOL from vault to user and close account', async () => {
    // create vault
    const { provider, program, operator, vaultPubkey, mintPubkey } =
      await createVault();

    // create investor and airdrop some SOL
    const { investor } = await createInvestorWithBalance({ provider });

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
      [
        Buffer.from('claim'),
        vaultPubkey.toBuffer(),
        investor.publicKey.toBuffer(),
      ],
      program.programId,
    )[0];

    // User's token account
    const userAta = getAssociatedTokenAddressSync(
      mintPubkey,
      investor.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
    );

    // rpc
    await createClaim({
      program,
      investor,
      operator,
      claimPubkey,
      vaultPubkey,
      mintPubkey,
      userAta,
      claimAmount: depositAmount,
    });

    //withdraw step

    await program.methods
      .withdraw()
      .accounts({
        investor: investor.publicKey,
        operator: operator.publicKey,
        vault: vaultPubkey,
        claim: claimPubkey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([investor])
      .rpc();

    // check vault balance
    const vaultBalance = await provider.connection.getBalance(vaultPubkey);
    expect(vaultBalance).toEqual(1628640);

    // check user balance
    const userBalance = await provider.connection.getBalance(
      investor.publicKey,
    );

    expect(userBalance).toEqual(1997925920);

    // Check if the claim account is closed
    // @ts-ignore
    const claimAccount = await program.account.claim?.fetchNullable(
      claimPubkey,
    );
    expect(claimAccount).toBeFalsy();
  });
});
