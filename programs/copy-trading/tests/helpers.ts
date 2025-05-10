import {
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import copyTradingVaultIdl from '../target/idl/copy_trading.json';
import path from 'path';
import { LiteSVM } from 'litesvm';

/*
 * The program id of the copy trading program
 */
export const PROGRAM_ID = new PublicKey(
  '8NMw7pjvKbBe3bNRmxtKidth4LcZT8249Eo2LxVbRvt9',
); // get from lib.rs

/*
 * discriminator for the create_vault instruction
 */
const createVaultDiscriminator = copyTradingVaultIdl.instructions.find(
  (ix) => ix.name === 'create_vault',
)?.discriminator;
export const CREATE_VAULT_DISCRIMINATOR = Buffer.from([
  ...createVaultDiscriminator,
]);

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
