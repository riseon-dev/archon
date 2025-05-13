import * as anchor from '@coral-xyz/anchor';
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
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

describe('Create Claim Instruction', () => {
  it('should burn user tokens and create a claim account', async () => {
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
    try {
      const tx = await createClaim({
        program,
        investor,
        operator,
        claimPubkey,
        vaultPubkey,
        mintPubkey,
        userAta,
        claimAmount: depositAmount,
      });
    } catch (error) {
      console.error('Error creating claim:', error);
      if (error.getLogs) console.error(error.getLogs());
      throw error;
    }

    // expect claim account to exist
    // @ts-ignore
    const claimAccount = await program.account.investorClaim.fetch(claimPubkey);
    expect(claimAccount.investor.toString()).toEqual(
      investor.publicKey.toString(),
    );
    expect(claimAccount.tokenAmount.toString()).toEqual(
      (depositAmount * LAMPORTS_PER_SOL).toString(),
    );

    // expect user's tokens to be empty (burned)
    const investorTokenAccountInfo =
      await provider.connection.getTokenAccountBalance(userAta);
    expect(investorTokenAccountInfo.value.amount.toString()).toEqual('0');
  });
});
