import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  FailedTransactionMetadata,
  LiteSVM,
  TransactionMetadata,
} from 'litesvm';
import * as path from 'path';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';

const COPY_TRADING_PROGRAM = path.join(
  __dirname,
  '../target/deploy/copy_trading.so',
);

const programId = new PublicKey('8NMw7pjvKbBe3bNRmxtKidth4LcZT8249Eo2LxVbRvt9'); // get from lib.rs

const CREATE_VAULT_DISCRIMINATOR = Buffer.from([
  29, 237, 247, 208, 193, 82, 54, 135,
]); // TODO load this from IDL file

describe('Create Vault Instruction', () => {
  it('should create vault', async () => {
    // init litesvm
    const svm = new LiteSVM().withSplPrograms().withBuiltins();

    // assign program to a program id and load it
    svm.addProgramFromFile(programId, COPY_TRADING_PROGRAM);

    // create operator and airdrop some SOL
    const operator = new Keypair();
    svm.airdrop(operator.publicKey, BigInt(LAMPORTS_PER_SOL));

    // create vault pubkey
    const [vaultPubkey, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), operator.publicKey.toBuffer()],
      programId,
    );

    const [mintPubkey, mintBump] = PublicKey.findProgramAddressSync(
      [Buffer.from(`mint`), vaultPubkey.toBuffer()],
      programId,
    );

    const blockhash = svm.latestBlockhash();
    const ixs = [
      new TransactionInstruction({
        programId,
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

    const tx = new Transaction();
    tx.recentBlockhash = blockhash;
    tx.add(...ixs);
    tx.sign(operator);
    console.log('tx', tx);

    console.log('Operator:', operator.publicKey.toString());
    console.log('Vault:', vaultPubkey.toString());
    console.log('Mint:', mintPubkey.toString());

    // let's sim it first
    const simRes = svm.simulateTransaction(tx);
    console.log('simulations response', simRes);
    if (simRes instanceof Error) {
      console.error('Simulation error details:', simRes);
    }

    const sendRes = svm.sendTransaction(tx);
    console.log('send response', sendRes);

    if (sendRes instanceof TransactionMetadata) {
      console.log('Tx Successful!', sendRes.logs());
      expect(simRes.meta().logs()).toEqual(sendRes.logs());
      expect(sendRes.logs()[1]).toBe('Program log: Instruction: CreateVault');
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
  });

  it.todo('should close vault');

  it.todo('should throw error (of type?) if vault uid already exists');

  it.todo('each vault should have its own token mint');
});
