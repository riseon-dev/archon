import * as anchor from '@coral-xyz/anchor';
import {createInvestorWithBalance, createVault, depositToVault} from './helpers';
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

describe('Deposit Instruction', () => {
  it('should allow deposits of sol', async () => {
    // create vault
    const { provider, program, operator, vaultPubkey, mintPubkey } =
      await createVault();

    // create investor and airdrop some SOL
    const { investor }  = await createInvestorWithBalance({ provider });

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

    // check vault sol balance
    const currentBalance = await provider.connection.getBalance(vaultPubkey);
    expect(currentBalance).toEqual(
      initialBalance + depositAmount * LAMPORTS_PER_SOL,
    );
  });

  it('should mint tokens to investor', async () => {
    // create vault
    const { provider, program, operator, vaultPubkey, mintPubkey } =
      await createVault();

    // create investor and airdrop some SOL
    const { investor }  = await createInvestorWithBalance({ provider });

    const mintToATA = getAssociatedTokenAddressSync(
      mintPubkey,
      investor.publicKey,
      false, // allowOwnerOffCurve parameter (optional)
      TOKEN_2022_PROGRAM_ID, // for spl-token-2022 specify it explicitly
    );

    const depositAmount = 0.2;

    await depositToVault({
      program,
      operator,
      vaultPubkey,
      mintPubkey,
      investor,
      depositAmount,
    });

    // check investor token balance
    const investorTokenAccountInfo =
      await provider.connection.getTokenAccountBalance(mintToATA);

    // given price has not moved, minted amount should be equal to deposit amount
    expect(investorTokenAccountInfo.value.amount).toEqual(
      (depositAmount * LAMPORTS_PER_SOL).toString(),
    );
  });
});
