import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';

const web3 = anchor.web3;

export const createVault = async () => {
  // provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.CopyTrading as Program;

  // operator account
  const operator = anchor.web3.Keypair.generate();

  // airdrop some SOL
  const airdropSignature = await provider.connection.requestAirdrop(
    operator.publicKey,
    anchor.web3.LAMPORTS_PER_SOL * 2,
  );
  await provider.connection.confirmTransaction(airdropSignature);

  // create vault pubkey
  const [vaultPubkey, vaultBump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('vault'), operator.publicKey.toBuffer()],
      program.programId,
    );

  // create mint pubkey
  const [mintPubkey, mintBump] = await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from('mint'), vaultPubkey.toBuffer()],
    program.programId,
  );

  // call the create vault transaction method
  const tx = await program.methods
    .createVault()
    .accounts({
      operator: operator.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      vault: vaultPubkey,
      mint: mintPubkey,
      systemProgram: web3.SystemProgram.programId,
    })
    .signers([operator])
    .rpc();

  console.log('Vault Create Tx Signature', tx);
  return {
    provider,
    program,
    operator,
    vaultPubkey,
    mintPubkey,
    vaultBump,
    mintBump,
  };
};

export const createInvestorWithBalance = async ({
  provider,
                                                }: {
  provider: anchor.AnchorProvider,
}) => {
  const investor = anchor.web3.Keypair.generate();
  const airdropSignature = await provider.connection.requestAirdrop(
    investor.publicKey,
    anchor.web3.LAMPORTS_PER_SOL * 2,
  );
  await provider.connection.confirmTransaction(airdropSignature);
  return {
    investor
  }
};

export const depositToVault = async ({
  program,
  operator,
  vaultPubkey,
  mintPubkey,
  investor,
  depositAmount,
}: {
  program: Program;
  operator: anchor.web3.Keypair;
  vaultPubkey: anchor.web3.PublicKey;
  mintPubkey: anchor.web3.PublicKey;
  investor: anchor.web3.Keypair;
  depositAmount: number;
}) => {
  const amount = new anchor.BN(depositAmount * anchor.web3.LAMPORTS_PER_SOL);

  const depositTx = await program.methods
    .deposit(amount)
    .accounts({
      investor: investor.publicKey,
      operator: operator.publicKey,
      vault: vaultPubkey,
      mint: mintPubkey,
      mintTo: getAssociatedTokenAddressSync(
        mintPubkey,
        investor.publicKey,
        false, // allowOwnerOffCurve parameter (optional)
        TOKEN_2022_PROGRAM_ID, // Specify the token program explicitly
      ),
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    })
    .signers([investor])
    .rpc();

  console.log('Deposit Tx Signature', depositTx);
};
