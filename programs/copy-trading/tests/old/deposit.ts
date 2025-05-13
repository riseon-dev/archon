import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { FailedTransactionMetadata, TransactionMetadata } from 'litesvm';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import {
  CREATE_VAULT_DISCRIMINATOR,
  createAndSignTransaction,
  createLiteSVMInstance,
  createVault,
  DEPOSIT_DISCRIMINATOR,
  depositDiscriminator,
  PROGRAM_ID,
} from './helpers';
import * as BN from 'bn.js';

describe('Create Vault Instruction', () => {
  it('should allow deposits of sol', async () => {
    // tests

    const svm = createLiteSVMInstance();
    const { vaultPubkey, mintPubkey, operator } = await createVault(svm);
    console.log('vaultPubkey', vaultPubkey.toBase58());
    console.log('mintPubkey', mintPubkey.toBase58());
    console.log('operator', operator.publicKey.toBase58());

    const solDepositAmount = new BN.BN(0.2 * LAMPORTS_PER_SOL);
    const initialVaultBalance = new BN.BN(
      svm.getBalance(vaultPubkey).toString(),
    );

    // create investor and airdrop some SOL
    const investor = new Keypair();
    svm.airdrop(investor.publicKey, BigInt(LAMPORTS_PER_SOL));

    const mintToAta = getAssociatedTokenAddressSync(
      mintPubkey,
      investor.publicKey,
    );
    console.log('mintToAta', mintToAta.toBase58());

    const solAmount = solDepositAmount.toArray('le', 8);

    console.log(`operator`, operator.publicKey.toBase58());

    const ixs = [
      new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: investor.publicKey, isSigner: true, isWritable: true },
          { pubkey: operator.publicKey, isSigner: false, isWritable: false },
          { pubkey: vaultPubkey, isSigner: false, isWritable: false },
          { pubkey: mintPubkey, isSigner: false, isWritable: false },
          { pubkey: mintToAta, isSigner: false, isWritable: true },
          {
            pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
            isSigner: false,
            isWritable: false,
          },
          { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
          {
            pubkey: SystemProgram.programId,
            isSigner: false,
            isWritable: false,
          },
          { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }, // add this
        ],
        data: Buffer.from([
          ...depositDiscriminator,
          ...operator.publicKey.toBytes(),
          ...solAmount,
        ]),
      }),
    ];

    const tx: Transaction = await createAndSignTransaction(svm, ixs, investor);
    const simResponse = svm.simulateTransaction(tx);
    console.log('sim response', simResponse.meta().logs());

    expect(
      simResponse
        .meta()
        .logs()
        .some((line) => line.includes('error')),
    ).toEqual(false);
    expect(
      simResponse
        .meta()
        .logs()
        .some((line) => line.includes('failed')),
    ).toEqual(false);

    const finalResponse = svm.sendTransaction(tx);

    if (finalResponse instanceof TransactionMetadata) {
      console.log('final response', finalResponse.logs());

      expect(
        finalResponse.logs().some((line) => line.includes('error')),
      ).toEqual(false);
      expect(
        finalResponse.logs().some((line) => line.includes('failed')),
      ).toEqual(false);

      expect(finalResponse.logs()[1]).toBe('Program log: Instruction: Deposit');
      const message =
        'Program 8NMw7pjvKbBe3bNRmxtKidth4LcZT8249Eo2LxVbRvt9 success';
      expect(finalResponse.logs()[finalResponse.logs().length - 1]).toBe(
        message,
      );

      // check balance on PDA
      const currentVaultBalance = new BN.BN(
        svm.getBalance(vaultPubkey).toString(),
      );
      console.log('initialVaultBalance', initialVaultBalance);
      console.log('currentVaultBalance', currentVaultBalance);

      // check vault balance is correct
      expect(currentVaultBalance.toString()).toEqual(
        solDepositAmount.add(initialVaultBalance).toString(),
      );

      return;
    }

    console.log('final response', finalResponse.toString());
    if (finalResponse instanceof FailedTransactionMetadata) {
      console.log(finalResponse.toString());
      console.log(finalResponse.err().toString());
      console.log(finalResponse.meta().logs());
      throw new Error('Transaction failed');
    }

    throw new Error('Unexpected tx failure');
  });
});
