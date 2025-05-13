import * as anchor from '@coral-xyz/anchor';
import { createVault } from './helpers';

describe('Create Vault Instruction', () => {
  it('should create vault', async () => {
    await createVault();
  });

  it.todo('should not allow closing of vault by non-operator');

  it.todo('should not allow closing vault if there are deposits');

  it.todo('should close vault');
});
