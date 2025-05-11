import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import copyTradingVaultIdl from '../target/idl/copy_trading.json';
import path from 'path';
import {
  FailedTransactionMetadata,
  LiteSVM,
  TransactionMetadata,
} from 'litesvm';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import assert from 'node:assert';

/*
 * The program id of the copy trading program
 */
export const PROGRAM_ID = new PublicKey(
  '8NMw7pjvKbBe3bNRmxtKidth4LcZT8249Eo2LxVbRvt9',
); // get from lib.rs

/*
 * discriminator for the create_vault instruction
 */
export const createVaultDiscriminator = copyTradingVaultIdl.instructions.find(
  (ix) => ix.name === 'create_vault',
)?.discriminator;
export const CREATE_VAULT_DISCRIMINATOR = Buffer.from([
  ...createVaultDiscriminator,
]);

/*
 * discriminator for the deposit instruction
 */
export const depositDiscriminator = copyTradingVaultIdl.instructions.find(
  (ix) => ix.name === 'deposit',
)?.discriminator;

export const DEPOSIT_DISCRIMINATOR = Buffer.from([...depositDiscriminator]);

/*
 * The path to the copy trading program
 */
export const COPY_TRADING_PROGRAM = path.join(
  __dirname,
  '../target/deploy/copy_trading.so',
);

/*
 * create a liteSVM instance and load the program
 */
export const createLiteSVMInstance = (): LiteSVM => {
  const svm = new LiteSVM().withSplPrograms().withBuiltins();
  svm.addProgramFromFile(PROGRAM_ID, COPY_TRADING_PROGRAM);
  return svm;
};

/*
 * create and sign a transaction
 */
export const createAndSignTransaction = async (
  svm: LiteSVM,
  instructions: TransactionInstruction[],
  operator: Keypair,
) => {
  const blockhash = svm.latestBlockhash();

  const tx = new Transaction();
  tx.recentBlockhash = blockhash;
  tx.add(...instructions);
  tx.sign(operator);

  return tx;
};

/*
 * create a vault and return vault address
 */
export const createVault = async (svm: LiteSVM) => {
  // create operator and airdrop some SOL
  const operator = new Keypair();
  svm.airdrop(operator.publicKey, BigInt(LAMPORTS_PER_SOL));

  // create vault pubkey
  const [vaultPubkey, vaultBump] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), operator.publicKey.toBuffer()],
    PROGRAM_ID,
  );

  const [mintPubkey, mintBump] = PublicKey.findProgramAddressSync(
    [Buffer.from(`mint`), vaultPubkey.toBuffer()],
    PROGRAM_ID,
  );

  const ixs = [
    new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: operator.publicKey, isSigner: true, isWritable: true },
        { pubkey: vaultPubkey, isSigner: false, isWritable: true },
        { pubkey: mintPubkey, isSigner: false, isWritable: true },
        { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
      ],
      data: CREATE_VAULT_DISCRIMINATOR,
    }),
  ];

  const tx: Transaction = await createAndSignTransaction(svm, ixs, operator);
  const sendRes = svm.sendTransaction(tx);

  if (sendRes instanceof TransactionMetadata) {
    const message =
      'Program 8NMw7pjvKbBe3bNRmxtKidth4LcZT8249Eo2LxVbRvt9 success';
    assert.equal(sendRes.logs()[sendRes.logs().length - 1], message);
  } else {
    if (sendRes instanceof FailedTransactionMetadata) {
      console.log(sendRes.toString());
      console.log(sendRes.err().toString());
      console.log(sendRes.meta().logs());
      throw new Error('Transaction failed');
    } else {
      throw new Error('Unexpected tx failure');
    }
  }

  return {
    vaultPubkey,
    vaultBump,
    mintPubkey,
    mintBump,
    operator,
  };
};
