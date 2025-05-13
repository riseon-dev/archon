// import {LiteSVM, TransactionMetadata} from "litesvm";
// import {
//   Keypair,
//   LAMPORTS_PER_SOL,
//   PublicKey,
//   SystemProgram,
//   Transaction,
//   TransactionInstruction,
// } from "@solana/web3.js";
// import * as path from "path";
// import {TOKEN_PROGRAM_ID} from '@solana/spl-token';
// import {createVaultSchema} from "./types";
//
// // https://solana.com/developers/courses/native-onchain-development/serialize-instruction-data-frontend
//
// const COPY_TRADING_PROGRAM = path.join(__dirname, "../target/deploy/copy_trading.so");
// // const TOKEN_METADATA_PROGRAM_ID = new PublicKey(`metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s`);
// const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID: PublicKey = new PublicKey(
//   'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
// );
// const SYSVAR_RENT_PUBKEY = new PublicKey('SysvarRent111111111111111111111111111111111');
// const programId = new PublicKey('2DHHZStK2bAjGEpbopuZsdaiJtxCCkzacUbeTQLmWrbh'); // get from lib.rs
// const [mintPubkey, mintBump] = PublicKey.findProgramAddressSync(
//   [Buffer.from(`mint`)],
//   programId
// );
//
// describe('Create Vault Instruction', () => {
//   it('should create vault', async () => {
//
//     // init litesvm
//     const svm = new LiteSVM().withSplPrograms().withSysvars().withBuiltins();
//     // assign program to a program id and load it
//     svm.addProgramFromFile(programId, COPY_TRADING_PROGRAM);
//
//
//     // create operator and airdrop some SOL
//     const operator = new Keypair();
//     svm.airdrop(operator.publicKey, BigInt(LAMPORTS_PER_SOL));
//     const uid = 1;
//
//     // create vault pubkey
//     const [vaultPubkey, vaultBump] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from("vault"),
//         operator.publicKey.toBuffer(),
//         Buffer.from([uid]), //Buffer.from(new Uint8Array([uid])),
//       ],
//       programId
//     );
//
//     // create instruction
//     // const rawInstruction = new CreateVaultSchema(6,   uid    );
//     //
//     // const instruction = serialize(rawInstruction);
//     const buffer = Buffer.alloc(10);
//     createVaultSchema.encode({
//       decimals: 6,
//       uid: uid,
//     }, buffer);
//     const instructionBuffer = buffer.subarray(0, createVaultSchema.getSpan(buffer));
//
//     const blockhash = svm.latestBlockhash();
//     const ixs = [
//       new TransactionInstruction({
//         programId,
//         keys: [
//           { pubkey: operator.publicKey, isSigner: true, isWritable: true },
//           { pubkey: vaultPubkey, isSigner: false, isWritable: true },
//           { pubkey: mintPubkey, isSigner: false, isWritable: true },
//
//           { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
//           { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
//           { pubkey: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID, isSigner: false, isWritable: false },
//           { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
//         ],
//         data: instructionBuffer,
//       }),
//     ];
//
//     const tx = new Transaction();
//     tx.recentBlockhash = blockhash;
//     tx.add(...ixs);
//     tx.sign(operator);
//
//     console.log("Operator:", operator.publicKey.toString());
//     console.log("Vault:", vaultPubkey.toString());
//     console.log("Mint:", mintPubkey.toString());
//
//     // let's sim it first
//     const simRes = svm.simulateTransaction(tx);
//     console.log('simulations response', simRes);
//     if (simRes instanceof Error) {
//       console.error("Simulation error details:", simRes);
//     }
//
//     const sendRes = svm.sendTransaction(tx);
//     console.log('send response', sendRes);
//
//     if (sendRes instanceof TransactionMetadata) {
//       expect(simRes.meta().logs()).toEqual(sendRes.logs());
//       expect(sendRes.logs()[1]).toBe("Program log: static string");
//     } else {
//       throw new Error("Unexpected tx failure");
//     }
//   });
//
//   it.todo('should close vault');
//
//   it.todo('should throw error (of type?) if vault uid already exists');
//
//   it.todo('each vault should have its own token mint');
// })
