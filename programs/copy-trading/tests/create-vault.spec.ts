import { LiteSVM, TransactionMetadata } from "litesvm";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import * as path from "path";

const COPY_TRADING_PROGRAM = path.join(__dirname, "../target/deploy/copy_trading.so");

describe('Create Vault Instruction', () => {
  it('should create vault', async () => {

    // init litesvm
    const svm = new LiteSVM();

    // assign program to a program id and load it
    const programId = PublicKey.unique();
    svm.addProgramFromFile(programId, COPY_TRADING_PROGRAM);

    // create operator and airdrop some SOL
    const operator = new Keypair();
    svm.airdrop(operator.publicKey, BigInt(LAMPORTS_PER_SOL));


    const blockhash = svm.latestBlockhash();
    const ixs = [
      new TransactionInstruction({
        programId,
        keys: [
          { pubkey: PublicKey.unique(), isSigner: false, isWritable: false },
        ],
      }),
    ];
    const tx = new Transaction();
    tx.recentBlockhash = blockhash;
    tx.add(...ixs);
    tx.sign(operator);

    // let's sim it first
    const simRes = svm.simulateTransaction(tx);
    console.log('simulations response', simRes);

    const sendRes = svm.sendTransaction(tx);
    console.log('send response', sendRes);

    if (sendRes instanceof TransactionMetadata) {
      expect(simRes.meta().logs()).toEqual(sendRes.logs());
      expect(sendRes.logs()[1]).toBe("Program log: static string");
    } else {
      throw new Error("Unexpected tx failure");
    }
  });

  it.todo('should close vault');

  it.todo('should throw error (of type?) if vault uid already exists');

  it.todo('each vault should have its own token mint');
})