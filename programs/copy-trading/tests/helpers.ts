import {PublicKey} from "@solana/web3.js";
import copyTradingVaultIdl from "../target/idl/copy_trading.json";

export const PROGRAM_ID = new PublicKey('8NMw7pjvKbBe3bNRmxtKidth4LcZT8249Eo2LxVbRvt9'); // get from lib.rs

const createVaultDiscriminator = copyTradingVaultIdl.instructions.find(ix => ix.name === 'create_vault')?.discriminator;

export const CREATE_VAULT_DISCRIMINATOR = Buffer.from([...createVaultDiscriminator]);