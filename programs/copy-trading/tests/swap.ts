import * as anchor from '@coral-xyz/anchor';
import {AnchorProvider, Program, Wallet as AnchorWallet} from '@coral-xyz/anchor';
import {PublicKey, Keypair, Connection} from '@solana/web3.js';
import {
  ORCA_WHIRLPOOL_PROGRAM_ID,
  ORCA_WHIRLPOOLS_CONFIG,
  PDAUtil,
  SwapUtils,
  swapQuoteByInputToken,
  WhirlpoolContext,
  buildWhirlpoolClient,
  IGNORE_CACHE,
} from '@orca-so/whirlpools-sdk';
import {
  TransactionBuilder,
  resolveOrCreateATA,
  DecimalUtil,
  Percentage,
  Wallet,
  TransactionBuilderOptions,
} from '@orca-so/common-sdk';
import { AccountLayout } from '@solana/spl-token';
import { CopyTrading } from '../target/types/copy_trading';
import BN from 'bn.js';

const SOL = {
  mint: new PublicKey('So11111111111111111111111111111111111111112'),
  decimals: 9,
};
const SAMO = {
  mint: new PublicKey('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'),
  decimals: 9,
};
const USDC = {
  mint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
  decimals: 6,
};

describe('Swap Instructions', () => {

  const connection = new Connection('http://127.0.0.1:8899', 'confirmed');
  const testWallet = Keypair.fromSecretKey(Buffer.from([117,37,137,255,111,177,234,144,186,79,159,201,57,65,169,71,191,1,209,192,238,154,32,26,65,155,215,147,71,39,43,254,5,253,22,252,205,245,105,231,33,109,96,190,218,229,203,158,161,145,119,82,18,145,190,127,181,155,168,196,136,169,10,64]));

  const program = anchor.workspace.CopyTrading as Program<CopyTrading>;
  const provider = new AnchorProvider(connection, new AnchorWallet(testWallet), {commitment: "confirmed"});
  const wallet = provider.wallet as Wallet;

  const whirlpool_ctx = WhirlpoolContext.withProvider(
    provider,
    ORCA_WHIRLPOOL_PROGRAM_ID,
  );
  const fetcher = whirlpool_ctx.fetcher;
  const whirlpool_client = buildWhirlpoolClient(whirlpool_ctx);

  const transaction_builder_opts: TransactionBuilderOptions = {
    defaultBuildOption: {
      maxSupportedTransactionVersion: 'legacy',
      blockhashCommitment: 'confirmed',
    },
    defaultConfirmationCommitment: 'confirmed',
    defaultSendOption: {
      skipPreflight: true,
    },
  };

  const sol_usdc_whirlpool_pubkey = PDAUtil.getWhirlpool(
    ORCA_WHIRLPOOL_PROGRAM_ID,
    ORCA_WHIRLPOOLS_CONFIG,
    SOL.mint,
    USDC.mint,
    64,
  ).publicKey;
  const samo_usdc_whirlpool_pubkey = PDAUtil.getWhirlpool(
    ORCA_WHIRLPOOL_PROGRAM_ID,
    ORCA_WHIRLPOOLS_CONFIG,
    SAMO.mint,
    USDC.mint,
    64,
  ).publicKey;

  const position_mint_keypair = Keypair.generate();
  const position_mint = position_mint_keypair.publicKey;
  const position_pda = PDAUtil.getPosition(
    ORCA_WHIRLPOOL_PROGRAM_ID,
    position_mint,
  );

  const verify_log = (logs: string[], message: string) => {
    expect(logs).toEqual(
      expect.arrayContaining([`Program log: verify! ${message}`]),
    );
  };
  const rent_ta = async () => {
    return connection.getMinimumBalanceForRentExemption(AccountLayout.span);
  };
  const sleep = (second) =>
    new Promise((resolve) => setTimeout(resolve, second * 1000));

  it('should be able to swap sol to usdc', async () => {
    const sol_usdc_whirlpool_oracle_pubkey = PDAUtil.getOracle(
      ORCA_WHIRLPOOL_PROGRAM_ID,
      sol_usdc_whirlpool_pubkey,
    ).publicKey;
    const sol_usdc_whirlpool = await fetcher.getPool(sol_usdc_whirlpool_pubkey);

    const sol_input = DecimalUtil.toBN(
      DecimalUtil.fromNumber(1000 /* SOL */),
      SOL.decimals,
    );
    const wsol_ta = await resolveOrCreateATA(
      connection,
      wallet.publicKey,
      SOL.mint,
      rent_ta,
      sol_input,
    );
    const usdc_ta = await resolveOrCreateATA(
      connection,
      wallet.publicKey,
      USDC.mint,
      rent_ta,
    );

    const amount = new anchor.BN(sol_input);
    const other_amount_threshold = new anchor.BN(0);
    const amount_specified_is_input = true;
    const a_to_b = true;
    const sqrt_price_limit = SwapUtils.getDefaultSqrtPriceLimit(a_to_b);

    const tickarrays = SwapUtils.getTickArrayPublicKeys(
      sol_usdc_whirlpool.tickCurrentIndex,
      sol_usdc_whirlpool.tickSpacing,
      a_to_b,
      ORCA_WHIRLPOOL_PROGRAM_ID,
      sol_usdc_whirlpool_pubkey,
    );

    const swap = await program.methods
      .swapFromSol(
        amount,
        other_amount_threshold,
        sqrt_price_limit,
        amount_specified_is_input,
        a_to_b,
      )
      .accounts({
        // (IDL generation) whirlpoolProgram: ORCA_WHIRLPOOL_PROGRAM_ID,
        whirlpool: sol_usdc_whirlpool_pubkey,
        tokenAuthority: wallet.publicKey,
        tokenVaultA: sol_usdc_whirlpool.tokenVaultA,
        tokenVaultB: sol_usdc_whirlpool.tokenVaultB,
        tokenOwnerAccountA: wsol_ta.address,
        tokenOwnerAccountB: usdc_ta.address,
        tickArray0: tickarrays[0],
        tickArray1: tickarrays[1],
        tickArray2: tickarrays[2],
        // (IDL generation) oracle: sol_usdc_whirlpool_oracle_pubkey,
        // (IDL generation) tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    const transaction = new TransactionBuilder(
      connection,
      wallet,
      transaction_builder_opts,
    )
      .addInstruction(wsol_ta)
      .addInstruction(usdc_ta)
      .addInstruction({
        instructions: [swap],
        cleanupInstructions: [],
        signers: [],
      });

    // verification
    const quote = await swapQuoteByInputToken(
      await whirlpool_client.getPool(sol_usdc_whirlpool_pubkey, IGNORE_CACHE),
      SOL.mint,
      sol_input,
      Percentage.fromFraction(0, 1000),
      ORCA_WHIRLPOOL_PROGRAM_ID,
      fetcher,
      IGNORE_CACHE,
    );

    const pre_usdc_ta = await fetcher.getTokenInfo(
      usdc_ta.address,
      IGNORE_CACHE,
    );
    const pre_usdc =
      pre_usdc_ta === null ? new anchor.BN(0) : pre_usdc_ta.amount;

    const signature = await transaction.buildAndExecute();
    await connection.confirmTransaction(signature);

    const post_usdc_ta = await fetcher.getTokenInfo(
      usdc_ta.address,
      IGNORE_CACHE,
    );
    const post_usdc = post_usdc_ta.amount;

    const usdc_output = new BN(post_usdc.toString()).sub(
      new BN(pre_usdc.toString()),
    );

    expect(usdc_output).toEqual(quote.estimatedAmountOut);
  });
});
