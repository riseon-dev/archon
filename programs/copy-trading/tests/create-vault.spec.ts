import { CopyTrading } from "../target/types/copy_trading";



describe('Create Vault Instruction', () => {
  it('should create vault', async () => {
    // // Configure the client to use the local cluster.
    // const provider = anchor.AnchorProvider.env();
    // anchor.setProvider(provider);
    //
    // const program = anchor.workspace.CopyTrading as Program<CopyTrading>;
    //
    // // Generate a new keypair for the vault
    // const operatorKeyPair = anchor.web3.Keypair.generate();
    // // Generate a new keypair for the vault
    // const vaultKeyPair = anchor.web3.Keypair.generate();
    //
    // // Create a new vault
    // const tx = await program.methods.createVault(1)
    //   .accounts({
    //     operator: operatorKeyPair.publicKey,
    //     mint: anchor.web3.PublicKey.default,
    //     tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
    //   })
    //   .signers([operatorKeyPair])
    //   .rpc();
    //
    // console.log("Transaction signature", tx);
  });

  it.todo('should close vault');

  it.todo('should throw error (of type?) if vault uid already exists');

  it.todo('each vault should have its own token mint');
})