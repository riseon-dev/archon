import * as anchor from '@coral-xyz/anchor';

const web3 = anchor.web3;

describe('Create Vault Instruction', () => {
  it('should create vault', async () => {
    const provider = anchor.AnchorProvider.local();
  });

  it.todo('should close vault');

  it.todo('should throw error (of type?) if vault uid already exists');

  it.todo('each vault should have its own token mint');
});
