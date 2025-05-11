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
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import {
  CREATE_VAULT_DISCRIMINATOR,
  createAndSignTransaction,
  createLiteSVMInstance,
  PROGRAM_ID,
} from './helpers';

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
);

describe('Create Vault Instruction', () => {
  it('should create vault', async () => {
    const svm = createLiteSVMInstance();

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

    const [metadataPubkey, metadataBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        vaultPubkey.toBuffer(),
      ],
      PROGRAM_ID,
    );

    const ixs = [
      new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: operator.publicKey, isSigner: true, isWritable: true },
          { pubkey: vaultPubkey, isSigner: false, isWritable: true },
          { pubkey: mintPubkey, isSigner: false, isWritable: true },

          // mint metadata pda from [b"metadata", token_metadata_program.key().as_ref(), vault.key().as_ref()],
          // { pubkey: metadataPubkey, isSigner: false, isWritable: true },

          { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },

          // token metadata program
          // { pubkey: TOKEN_METADATA_PROGRAM_ID, isSigner: false, isWritable: false},
          {
            pubkey: SystemProgram.programId,
            isSigner: false,
            isWritable: false,
          },

          // rent
          // { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false},
        ],
        data: CREATE_VAULT_DISCRIMINATOR,
      }),
    ];

    const tx: Transaction = await createAndSignTransaction(svm, ixs, operator);

    // let's sim it first
    const simRes = svm.simulateTransaction(tx);
    if (simRes instanceof Error) {
      console.error('Simulation error details:', simRes);
    }

    const sendRes = svm.sendTransaction(tx);

    if (sendRes instanceof TransactionMetadata) {
      expect(simRes.meta().logs()).toEqual(sendRes.logs());
      expect(sendRes.logs()[1]).toBe('Program log: Instruction: CreateVault');
      const message =
        'Program 8NMw7pjvKbBe3bNRmxtKidth4LcZT8249Eo2LxVbRvt9 success';
      expect(sendRes.logs()[sendRes.logs().length - 1]).toBe(message);
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

  it.todo('should not allow closing of vault by non-operator');

  it.todo('should not allow closing vault if there are deposits');

  it.todo('should close vault');
});
