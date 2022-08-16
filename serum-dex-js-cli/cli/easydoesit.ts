import BN from 'bn.js';

  import {
    AddressLookupTableProgram,
    AddressLookupTableInstruction,
    Connection,
    sendAndConfirmTransaction,
} from '@solana/web3.js';
import WebSocket, { Server } from 'ws';
import { createServer } from 'http';
import * as bs58 from 'bs58';
import fs from 'fs';

import { Token } from '@solana/spl-token';
import * as borsh from 'borsh';
import { getOrCreateAssociatedTokenAccount } from './getorcreate';
import * as web3 from '@solana/web3.js';
import {
  closeAccount,
  initializeAccount,
  MSRM_DECIMALS,
  MSRM_MINT,
  SRM_DECIMALS,
  SRM_MINT,
  TOKEN_PROGRAM_ID,
  WRAPPED_SOL_MINT,
} from '../token-instructions';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  AccountInfo,
  TransactionInstruction,
  AccountMeta,
  Transaction,
  Account,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
const poordev = true;
const marketMaker = require('./market-maker');

const marketProxy = require('./market-proxy');

import * as anchor from '@project-serum/anchor';

const { OpenOrdersPda } = require('@project-serum/serum');

import { sendTransactionWithRetryWithKeypair } from './transactions';
import { getAtaForMint } from './accounts';
import { Key } from '@metaplex-foundation/mpl-token-metadata';
let SERUM_DEX = new PublicKey('9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin');
const v8 = require('v8');

interface WorthlessEntry {
  prices: number[];
  market_ids: string[];
  tokens: string[];
  volumes: number[];
  profit_potential: number;
  decimals: number[];
  token_ids: string[];
  trades: ('BID' | 'ASK')[]; // BUY | SELL
}
function ablarg(market,connection,
    owner,
    openOrders,
    bW,
    qW,
    referrerQuoteWallet){

setTimeout(async function(){
    try {
    await market.settleFunds(
        connection,
    owner,
    openOrders,
    bW,
    qW,
    referrerQuoteWallet
        )
    } catch (err){
        
    }
}, 1000)
}
async function sendTransaction(
  connection: any,
  transaction: Transaction,
  signers: Array<Keypair>,
): Promise<any> {
  let ns: Keypair[] = [];
  for (var signer of signers) {
    if (signer.publicKey) {
      console.log(signer.publicKey.toBase58());
      // @ts-ignore
      ns.push(signer);
    }
  }
  transaction.feePayer = wallet.publicKey;
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash('confirmed')
  ).blockhash;
  try {
    const signature = await provider.send(transaction, ns);

    /*
  const { value } = await connection.confirmTransaction(
    signature,
    'recent',
  );
  if (value?.err) {
    throw new Error(JSON.stringify(value.err));
  }  */

    return signature;
  } catch (err) {
    return err;
  }
}

export function loadWalletKey(keypair: string): Keypair {
  if (!keypair || keypair == '') {
    throw new Error('Keypair is required!');
  }
  const loaded = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(keypair).toString())),
  );
  console.info(`wallet public key: ${loaded.publicKey}`);
  return loaded;
}
let wallet = loadWalletKey('./id.json');
let pubkey = wallet.publicKey;

//let connection = new web3.Connection("https://solana-api.projectserum.com")//https://rpc.theindex.io/mainnet-beta/4ae962ec-5c8c-4071-9ef2-e5c6b59bdf3e")/
let connection = new web3.Connection(
  'https://solana--mainnet.datahub.figment.io/apikey/fff8d9138bc9e233a2c1a5d4f777e6ad',
);

// @ts-ignore
const walletWrapper = new anchor.Wallet(wallet);
// @ts-ignore
const provider = new anchor.Provider(connection, walletWrapper, {
  skipPreflight: true,
});

import { Market as m2 } from '../packages/serum/lib/market';
import { Market } from '@project-serum/serum'


const PromisePool = require('@supercharge/promise-pool').default;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
let markets = [];
let baseQuotes = {};
let opps = {};
async function doTrade(trade: any) {
  try {
      const transaction = new Transaction();
      const signers: Keypair[] = [];

      const tx = new Transaction();
      let signers2: any = [];
    if (true) {
      trade.profit_potential = trade.profit_potential - 0.01;
    console.log(trade.profit_potential);
      let market_ids = trade.market_ids;
      let trades = trade.trades;
      let prices = trade.prices;
      let volumes = trade.volumes;
      // @ts-ignore
      let insts = [];
      let payer;

      let account;

      account = new Keypair();

      let openOrdersAddress = account.publicKey;
      // @ts-ignore
      let newinsts = [];

      transaction.recentBlockhash = (
        await connection.getLatestBlockhash('recent')
      ).blockhash;
      let insts2: any = [];

      let marketMakerAccounts;
      let side;
      let market;
      let referrerQuoteWallet;
      let openOrdersAccounts;
      let openOrders;
        console.log(market_ids)
      for (var which in market_ids) {
        try {
          if (true) {
            //parseInt(which) <= 1){
                  console.log(market_ids[which][1])
                  console.log(market_ids[which][0])
            market = await Market.load(
              connection,
              new PublicKey(market_ids[which][0]),
              { skipPreflight: true, commitment: 'recent' },
              new PublicKey(market_ids[which][1]),
            );
            const ownerAddress: PublicKey = wallet.publicKey;
            const [_openOrders, bump] = await PublicKey.findProgramAddress(
              [
                anchor.utils.bytes.utf8.encode('open-orders'),
                new PublicKey(market_ids[which][0]).toBuffer(),
                new PublicKey(market_ids[which][1]).toBuffer(),
                wallet.publicKey.toBuffer(),
              ],
              SERUM_DEX,
            );
              console.log(1)
            const [_openOrdersInitAuthority, bumpInit] =
              await PublicKey.findProgramAddress(
                [
                  anchor.utils.bytes.utf8.encode('open-orders-init'),
                  new PublicKey(market_ids[which][0]).toBuffer(),
                  new PublicKey(market_ids[which][1]).toBuffer(),
                ],
                SERUM_DEX,
              );

              console.log(2)
            // Save global variables re-used across tests.
            openOrders = _openOrders;
         
              console.log(3)
        
            var bT = await getAtaForMint(
              market.baseMintAddress,
              wallet.publicKey,
            )[0];
            referrerQuoteWallet = await getOrCreateAssociatedTokenAccount(
              connection,
              wallet.publicKey,
              market.quoteMintAddress,
              // @ts-ignore
              provider.wallet,
              new PublicKey('DuNNX7BkxNzK26eJSwhwaJ5D4EneM1D7ATsPhGgezDgg'),
              true,
            );
              console.log(4)
            var qT = await getAtaForMint(
              market.quoteMintAddress,
              wallet.publicKey,
            )[0];

              console.log(5)
            marketMakerAccounts = {
              account: wallet,
              owner: wallet,
              baseToken: bT, //new PublicKey("So11111111111111111111111111111111111111112"),//fundedAccount.tokens[mintGodA.mint.toString()],
              quoteToken: qT, //new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")//fundedAccount.tokens[mintGodB.mint.toString()],
              baseMint: market.baseMintAddress,
              quoteMint: market.quoteMintAddress,
            };
              console.log(6)
            try {
              console.log(marketMakerAccounts.baseToken.toBase58());
              console.log(marketMakerAccounts.quoteToken.toBase58());
            } catch (err) {
              var bT = await getOrCreateAssociatedTokenAccount(
                connection,
                wallet.publicKey,
                market.baseMintAddress,
                // @ts-ignore
                provider.wallet,
                wallet.publicKey,
                true,
              );
              referrerQuoteWallet = await getOrCreateAssociatedTokenAccount(
                connection,
                wallet.publicKey,
                market.quoteMintAddress,
                // @ts-ignore
                provider.wallet,
                new PublicKey('DuNNX7BkxNzK26eJSwhwaJ5D4EneM1D7ATsPhGgezDgg'),
                true,
              );
              var qT = await getOrCreateAssociatedTokenAccount(
                connection,
                wallet.publicKey,
                market.quoteMintAddress,
                // @ts-ignore
                provider.wallet,
                wallet.publicKey,
                true,
              );
              marketMakerAccounts = {
                account: wallet,
                owner: wallet,
                baseToken: bT, //new PublicKey("So11111111111111111111111111111111111111112"),//fundedAccount.tokens[mintGodA.mint.toString()],
                quoteToken: qT, //new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")//fundedAccount.tokens[mintGodB.mint.toString()],
                baseMint: market.baseMintAddress,
                quoteMint: market.quoteMintAddress,
              };
              try {
                console.log(marketMakerAccounts.baseToken.toBase58());
                console.log(marketMakerAccounts.quoteToken.toBase58());
              } catch (err) {
                  console.log(err)
                var bT = await getAtaForMint(
                  market.baseMintAddress,
                  wallet.publicKey,
                )[0];
                var qT = await getAtaForMint(
                  market.quoteMintAddress,
                  wallet.publicKey,
                )[0];
                marketMakerAccounts = {
                  account: wallet,
                  owner: wallet,
                  baseToken: bT, //new PublicKey("So11111111111111111111111111111111111111112"),//fundedAccount.tokens[mintGodA.mint.toString()],
                  quoteToken: qT, //new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")//fundedAccount.tokens[mintGodB.mint.toString()],
                  baseMint: market.baseMintAddress,
                  quoteMint: market.quoteMintAddress,
                };
              }
            }
            transaction.feePayer = marketMakerAccounts.baseToken;
            // @ts-ignore
            /*

    market,
    options = {},
    dexProgramId,
    proxyProgramId,const marketProxyClient = await marketProxy.load(
    provider.connection,
    proxyProgramId,
    DEX_PID,
    marketAPublicKey
  );
*/
            const marketProxyClient = await marketProxy.load(
              connection,
              new PublicKey(market_ids[which][1]),

              SERUM_DEX,
              new PublicKey(market_ids[which][0]),
            );

            var openOrdersAddressKey: PublicKey =
              await OpenOrdersPda.openOrdersAddress(
                marketProxyClient.market.address,
                marketMakerAccounts.account.publicKey,
                marketProxyClient.dexProgramId,
                marketProxyClient.proxyProgramId,
              );
            //var openOrdersAddressKey = new PublicKey("DW9kzAmYEMpfeZEbMpoTkHnnFz81RToapmApwMtULJZ4")
            //openOrdersAddressKey = account.publicKey
            // Fetching orderbooks
            /*
let bids = await market.loadBids(connection);
let asks = await market.loadAsks(connection);
// L2 orderbook data

let price = 0
let size = 0
for (let [price2, size2] of bids.getL2(1)) {
  price = price2 
  size = size2
  console.log(price, size);
}
 let side = trades[which] == 'BID' ? 'sell' : 'buy'
 if (side == 'buy'){
for (let [price2, size2] of asks.getL2(1)) {
  price = price2 
  size = size2
  console.log(price, size);
}
*/
            side = trades[which] == 'BID' ? 'sell' : 'buy';

            var size = 1//volumes[which]; /// 13.8 / 3
            //size = 1
            var price = prices[which];
            console.log([size, price]);
            //size = 1

            let maxT = 5000;
            let cacheDurationMs = maxT;
            let orderType = 'ioc';
            let feeDiscountPubkey = undefined;
            let clientId = undefined;
            let owner = wallet;
            payer =
              side == 'buy'
                ? marketMakerAccounts.quoteToken
                : marketMakerAccounts.baseToken;
            let selfTradeBehavior = 'decrementTake';
              console.log(
              connection, // @ts-ignore
              {
                stuff: [{ side, price, size }],
                owner,
                payer,
                orderType,
                openOrdersAddressKey,
                bW: marketMakerAccounts.baseToken,
                qW: marketMakerAccounts.quoteToken,
              },
            )
            let m123 =      await m2.load(
              connection,
              new PublicKey(market_ids[which][0]),
              { skipPreflight: true, commitment: 'recent' },
              new PublicKey(market_ids[which][1]),
            );
            let ou = await m123.placeOrder(
              
              new Connection("https://solana-api.projectserum.com"), // @ts-ignore
              {
                stuff: [{ side, price, size }],
                // @ts-ignore
                owner,
                payer,
                // @ts-ignore
                orderType,
                openOrdersAddressKey,
                bW: marketMakerAccounts.baseToken,
                qW: marketMakerAccounts.quoteToken,
              },
            );
            
            console.log(ou.insts.length);
            tx.add(...ou.insts);
            for (var s of ou.signers) {
              if (!signers2.includes(s)) {
                signers2.push(s);
              }
            }
          }
        } catch (err) {
          console.log(err);
        }
      }
      console.log('....woot');
      let bW = marketMakerAccounts.baseToken;
      let qW = marketMakerAccounts.quoteToken;
      const ownerAddress: PublicKey = wallet.publicKey;
        
        
      if (insts2.length > 0) {
        tx.add(...insts2);
      }
      console.log(tx.instructions.length);
      console.log(tx.instructions.length);
      console.log(tx.instructions.length);
      console.log(tx.instructions.length);
      console.log(tx.instructions.length);
      console.log(tx.instructions.length);
      console.log(tx.instructions.length);
      console.log(tx.instructions.length);
      var thething;
      var theh = wallet.publicKey;
      side == 'sell'
        ? (thething = marketMakerAccounts.quoteMint)
        : marketMakerAccounts.baseMint;
   
      var thet = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet.publicKey,
        market.quoteMintAddress,
        // @ts-ignore
        provider.wallet,
        theh,
        true,
      );

      console.log(market.quoteMintDecimals);
      console.log(market.quoteMintDecimals);
      console.log(market.quoteMintDecimals);
      console.log(market.quoteMintDecimals);
      console.log(market.quoteMintDecimals);
        try {        let hmm123123 = new anchor.BN(
            Math.floor(
              size *
            1.01 *
                10 **
                  (side == 'sell'
                    ? market.quoteMintDecimals
                    : market.baseMintDecimals),
            ),
          )
        console.log(hmm123123)
      tx.add(
        Token.createTransferInstruction(
          TOKEN_PROGRAM_ID,
          side == 'sell'
            ? marketMakerAccounts.quoteToken
            : marketMakerAccounts.baseToken,
          thet,
          wallet.publicKey,
          [],
          hmm123123,
        ),
      ); } catch (err){
          
      }
ablarg(
    market,
    
    connection,
    wallet,
    await PublicKey.findProgramAddress(
              [
                anchor.utils.bytes.utf8.encode('open-orders'),
                new PublicKey(market_ids[which][0]).toBuffer(),
                new PublicKey(market_ids[which][1]).toBuffer(),
                wallet.publicKey.toBuffer(),
              ],
              SERUM_DEX,
            ),
    bW,
    qW,
    referrerQuoteWallet
)
      /*
// @ts-ignore
const ownerAddress: PublicKey = owner.publicKey ?? owner;
let openOrdersAccounts = await market.findOpenOrdersAccountsForOwner(
  connection,
  ownerAddress
);
// @ts-ignore
//openOrdersAccounts = [account]
console.log(openOrdersAccounts)
// Fetch an SRM fee discount key if the market supports discounts and it is not supplied
let useFeeDiscountPubkey: PublicKey | null;
if (feeDiscountPubkey) {
  useFeeDiscountPubkey = feeDiscountPubkey;
} else if (
  feeDiscountPubkey === undefined &&
  market.supportsSrmFeeDiscounts
) {
  useFeeDiscountPubkey = (
    await market.findBestFeeDiscountKey(
      connection,
      ownerAddress,
      5000,
    )
  ).pubkey;
} else {
  useFeeDiscountPubkey = null;
}

if (openOrdersAccounts.length === 0) {

  // refresh the cache of open order accounts on next fetch
}  else if (openOrdersAddressKey) {
  openOrdersAddress = openOrdersAddressKey;
} else {
  openOrdersAddress = openOrdersAccounts[0].address;
}

let wrappedSolAccount: Keypair | null = null;
if (payer.equals(ownerAddress)) {
  if (
    (side === 'buy' && market.quoteMintAddress.equals(WRAPPED_SOL_MINT)) ||
    (side === 'sell' && market.baseMintAddress.equals(WRAPPED_SOL_MINT))
  ) {
    wrappedSolAccount = new Keypair();
    let lamports;
    if (side === 'buy') {
      lamports = Math.round(price * size * 1.01 * LAMPORTS_PER_SOL);
      if (openOrdersAccounts.length > 0) {
        lamports -= openOrdersAccounts[0].quoteTokenFree.toNumber();
      }
    } else {
      lamports = Math.round(size * LAMPORTS_PER_SOL);
      if (openOrdersAccounts.length > 0) {
        lamports -= openOrdersAccounts[0].baseTokenFree.toNumber();
      }
    }
    lamports = Math.max(lamports, 0) + 1e7;
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: ownerAddress,
        newAccountPubkey: wrappedSolAccount.publicKey,
        lamports,
        space: 165,
        programId: TOKEN_PROGRAM_ID,
      }),
    );
    transaction.add(
      initializeAccount({
        account: wrappedSolAccount.publicKey,
        mint: WRAPPED_SOL_MINT,
        owner: ownerAddress,
      }),
    );  
    if (!signers.includes(wrappedSolAccount)){
    signers.push(wrappedSolAccount);
    }
  } else {
    throw new Error('Invalid payer account');
  }
}

const placeOrderInstruction = market.makePlaceOrderInstruction(connection, {
  owner,
  payer: wrappedSolAccount?.publicKey ?? payer,
  // @ts-ignore
  side,
  price,
  size, // @ts-ignore
  orderType,
  clientId,
  openOrdersAddressKey: openOrdersAddress,
  feeDiscountPubkey: useFeeDiscountPubkey, // @ts-ignore
  selfTradeBehavior,
  maxTs: 5000
});
transaction.add(placeOrderInstruction);
    if (parseInt(which) == 0){
    openOrdersAddress = account.publicKey;
   
   //console.(transaction.instructions.length)
   console.log(transaction)
   // @ts-ignore
   let wow = await provider.send(transaction, [...signers, wallet])// sendTransactionWithRetryWithKeypair(connection, wallet, transaction, signers)
    }
    */
      //console.(transaction.instructions.length)
      // }
      /*
    market.placeOrder(
    connection,
    {
      owner: wallet,
      payer,
      side,
      price,
      size,
      price2,
      size2,
      orderType = 'ioc',
      clientId,
      openOrdersAddressKey,
      openOrdersAccount,
      feeDiscountPubkey,
    }
 } */
    }
      return { connection, tx, signers2 };

    //let data = [{"prices":[0.27851702250432776,3.482,0.29,0.8163265306122448,1.254],"market_ids":["HWHvQhFmJB3NUcu1aihKmrKegfVxBEHzwVX6yZCKEsi1","HWHvQhFmJB3NUcu1aihKmrKegfVxBEHzwVX6yZCKEsi1","HWHvQhFmJB3NUcu1aihKmrKegfVxBEHzwVX6yZCKEsi1","8afKwzHR3wJE7W7Y5hvQkngXh6iTepSZuutRMMy96MjR","8afKwzHR3wJE7W7Y5hvQkngXh6iTepSZuutRMMy96MjR"],"tokens":["USDT","SUSHI","USDC","USDT","SXP","USDT"],"volumes":[10,10,10,842.2,5161.8],"profit_potential":1.0578279642742414,"trades":["BID","ASK","BID","ASK","ASK","BID"]}]//,{"prices":[0.8163265306122448,1.254,0.28851702250432776,3.582,0.9999000099990001],"market_ids":["8afKwzHR3wJE7W7Y5hvQkngXh6iTepSZuutRMMy96MjR","8afKwzHR3wJE7W7Y5hvQkngXh6iTepSZuutRMMy96MjR","6DgQRTpJTnAYBSShngAVZZDq7j9ogRN1GfSQ3cq9tubW","A1Q9iJDVVS8Wsswr9ajeZugmj64bQVCYLZQLra2TMBMo","77quYg4MGneUdjgXCunt9GgM1usmrxKY31twEy3WHwcS"],"tokens":["USDT","SXP","USDT","SUSHI","USDC","USDT"],"volumes":[842.2,5161.8,0.19,0.46,56740],"profit_potential":1.0578279642742412,"trades":["ASK","BID","ASK","BID","ASK"]}]

    //}
    // @ts-ignore
  } catch (err) {
    console.log(err);
  }
}
interface WorthlessEntry {
  prices: number[];
  market_ids: string[];
  tokens: string[];
  volumes: number[];
  profit_potential: number;
  decimals: number[];
  token_ids: string[];
  trades: ('BID' | 'ASK')[]; // BUY | SELL
}
setTimeout(async function(){
//let hm = await doTrade({"prices":[0.02,0.00194,399.08,1.0003],"tokens":["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v","Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB","5Fu5UUgbjpUvdBveb3a1JTNirL8rXtiYeSMWvKjtUNQv","EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"],"market_ids":[["4ztJEvQyryoYagj2uieep3dyPwG2pyEwb2dKXTwmXe82","11111111111111111111111111111111"],["4ztJEvQyryoYagj2uieep3dyPwG2pyEwb2dKXTwmXe82","FJwFtQFEyKEA4M6ZTrosTRPJphEpDA9ckUeMq9pRJdd4"],["77quYg4MGneUdjgXCunt9GgM1usmrxKY31twEy3WHwcS","AXUChvpRwUUPMJhA4d23WcoyAL7W8zgAeo7KoH57c75F"],["7nZP6feE94eAz9jmfakNJWPwEKaeezuKKC5D1vrnqyo2","7ivguYMpnUBMboByJbKc7z31fJMg2pXYQ4nNPziWLchZ"]],"profit_potential":1.107,"trades":["BID","ASK","BID","ASK"]})
//console.log(hm)
       
  //let ahh =  await sendTransaction(hm.connection, hm.tx, [
 //   wallet,
     // @ts-ignore
 //   ...hm.signers2,
 //  ]
  // );

})
export class Blockchain {
  connection: Connection;
  DEX_PROGRAM_ID = new PublicKey(
    'HYsk1Qc2NryTaMT8qLRRxuYXqt9fEU7aAZCUa17eHgE9',
  );

  // ownerKp: Keypair = Keypair.fromSecretKey(Uint8Array.from([208, 175, 150, 242, 88, 34, 108, 88, 177, 16, 168, 75, 115, 181, 199, 242, 120, 4, 78, 75, 19, 227, 13, 215, 184, 108, 226, 53, 111, 149, 179, 84, 137, 121, 79, 1, 160, 223, 124, 241, 202, 203, 220, 237, 50, 242, 57, 158, 226, 207, 203, 188, 43, 28, 70, 110, 214, 234, 251, 15, 249, 157, 62, 80]));
  ownerKp: Keypair;

  marketKp = new Keypair();
  reqQKp = new Keypair();
  eventQKp = new Keypair();
  bidsKp = new Keypair();
  asksKp = new Keypair();

  //mints
  coinMint: Token;
  pcMint: Token;
  // srmMint: Token;
  // msrmMint: Token;

  //the protocol
  coinVaultPk: PublicKey;
  pcVaultPk: PublicKey;

  //user 1
  coinUserPk: PublicKey;
  pcUserPk: PublicKey;
  // srmUserPk: PublicKey;
  msrmUserPk: PublicKey;

  //user 2
  coinUser2Pk: PublicKey;
  pcUser2Pk: PublicKey;
  // srmUser2Pk: PublicKey;
  // msrmUser2Pk: PublicKey;

  market: Market;

  // --------------------------------------- connection

  async getConnection() {
    const url = 'http://localhost:8899';
    this.connection = new Connection(url, 'recent');
    const version = await this.connection.getVersion();
    console.log('connection to cluster established:', url, version);
  }

  // --------------------------------------- init market


  async printMetrics() {
    console.log('// ---------------------------------------');
    let someblargs = {};
    const testFolder = '../ha/';
    const fs = require('fs');

    this.connection = new Connection(
      'https://api.devnet.solana.com',
      'confirmed',
    );
    let ani = 0;
    let bb = 0;
    let ba = 999999999;
    let markets = JSON.parse(fs.readFileSync('./markets.json').toString());
    let maybeusdcs = [];
    for (var m of markets) {
      if (!maybeusdcs.includes(m['quote'])) {
        maybeusdcs.push(m['quote']);
      }
      if (!Object.keys(baseQuotes).includes(m['quote'] + '/' + m['base'])) {
        baseQuotes[m['quote'] + '/' + m['base']] = [
          { proxy: m.key2, market: m.key1 },
        ];
        opps[m['quote'] + '/' + m['base']] = {
          quotep: '',
          basep: '',
          quotem: '',
          basem: '',
          quote: m['quote'],
          base: m['base'],
          ba: 99999999999,
          bb: 0,
        };
      } else {
        baseQuotes[m['quote'] + '/' + m['base']].push({
          proxy: m.key2,
          market: m.key1,
        });
      }
    }
    let liqsample = JSON.parse(fs.readFileSync('./liqsample.json').toString())
    const authorityPubkey = wallet.publicKey
    const payerPubkey = wallet.publicKey
    let recentSlot = (await connection.getLatestBlockhash()).lastValidBlockHeight
    const [instruction] = AddressLookupTableProgram.createLookupTable({
      authority: authorityPubkey,
      payer: payerPubkey,
      recentSlot,
    });

    const transaction = new Transaction().add(instruction);
    const createLutParams = {
      authority: authorityPubkey,
      payer: payerPubkey,
      recentSlot,
    };
    //https://github.com/solana-labs/solana/blob/8e30dbbbf252a4d912b901284a412877ddae93a1/web3.js/test/program-tests/address-lookup-table.test.ts
    for (var abc in liqsample){
      if (liqsample[abc].liqtopbbos > 300){
        markets.push(liqsample[abc])
      }
    }
   let abc2 = await provider.send(transaction, [wallet])
   console.log(abc2)
   
     console.log(baseQuotes) /*
 await PromisePool.withConcurrency(200)
      .for(Object.keys(baseQuotes))
      // @ts-ignore
      .handleError(async (err, asset) => {
        console.error(`\nError uploading or whatever`, err.message);
        //  console.log(err);
      })
      // @ts-ignore
      .process(async market => {
        try {           for (var abc in baseQuotes[market]){
              let market2 = await Market.load(
                this.connection,
                new PublicKey(baseQuotes[market][abc].market),
                {},
                new PublicKey(baseQuotes[market][abc].proxy),
              );
                
              let bids = await market2.loadBids(this.connection);
              let asks = await market2.loadAsks(this.connection);

              // bids

              for (let [price, size] of bids.getL2(1)) {
                if (price > opps[market].bb) {
                  opps[market].bb = price;
                  opps[market].quotem = baseQuotes[market][abc].market;
                  opps[market].quotep = baseQuotes[market][abc].proxy;
                }
              }

              for (let [price, size] of asks.getL2(1)) {
                if (price < opps[market].ba) {
                  opps[market].ba = price;
                  opps[market].basem = baseQuotes[market][abc].market;
                  opps[market].basep = baseQuotes[market][abc].proxy;
                }
              }
            }
            
       }
      catch (err){
          console.log(err)
      }
 }) 
 /*
      console.log('1')
    fs.writeFileSync('./baseQuotes.json', JSON.stringify(baseQuotes));
    //  console.log(baseQuotes)
    await PromisePool.withConcurrency(400)
      .for(Object.keys(baseQuotes))
      // @ts-ignore
      .handleError(async (err, asset) => {
        console.error(`\nError uploading or whatever`, err.message);
        //  console.log(err);
      })
      // @ts-ignore
      .process(async market => {
        opps[market].liqtopbbos = 0
        try {
           let maybeusd = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
           if (market.split('/')[0] == "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" ){
            for (var abc in baseQuotes[market]) {

              let market2 = await Market.load(
                this.connection,
                new PublicKey(baseQuotes[market][abc].market),
                {},
                new PublicKey(baseQuotes[market][abc].proxy),
              );
                
                
              let bids = await market2.loadBids(this.connection);
              let asks = await market2.loadAsks(this.connection);

              // bids
              let bsize = 0
              for (let [price, size] of bids.getL2(3)) {
                bsize += (size / 10 ** 6 )/ price
                if (price > opps[market].bb) {
                  opps[market].bb = price;
                  opps[market].quotem = baseQuotes[market][abc].market;
                  opps[market].quotep = baseQuotes[market][abc].proxy;
                }
              }
              let asize = 0
              for (let [price, size] of asks.getL2(3)) {
                asize +=(size / 10 ** 6 )/ price
                if (price < opps[market].ba) {
                  opps[market].ba = price;
                  opps[market].basem = baseQuotes[market][abc].market;
                  opps[market].basep = baseQuotes[market][abc].proxy;
                }
              }
              
              opps[market].liqtopbbos+=   asize + bsize 

            }
            

            
              let s1 = (opps[market].bb / opps[market].ba - 1) * 100;
              let usdc = maybeusd + '/' + market.split('/')[0];
              let s2 = (opps[usdc].ba * opps[usdc].bb - 1) * 100;
              let s3 = s1 / s2;
              let usdc2 = maybeusd + '/' + market.split('/')[1];
              let s4 = (opps[usdc2].bb / opps[usdc2].ba - 1) * 100;
              let s5 = s4 / s3;
              console.log(s5)
              if (s5 > 1 && s5 < 5000) {console.log(s5)

                //console.log(s1 / s2)
                console.log(
                  'arb opp usdc-coin-something-usdc ' +
                    s5.toPrecision(3).toString() +
                    '%',
                );
                // console.log(opps[market])
           

                let athing = {
                  prices: [
                    opps[market].bb,
                    opps[market].ba,
                    opps[usdc2].ba,
                    opps[usdc].bb,
                  ],

                  tokens: [
                    maybeusd,
                    market.split('/')[0],
                    market.split('/')[1],
                    maybeusd,
                  ],

                  market_ids: [
                    [opps[market].basep, opps[market].basem],
                    [opps[market].quotep, opps[market].quotem],
                    [opps[usdc].basep, opps[usdc].basem],
                    [opps[usdc2].quotep, opps[usdc2].quotem],
                  ], //volumes,pp
                  profit_potential: s5, //decimalslol,
                  trades: ['BID', 'ASK', 'BID', 'ASK'],
                };
                
               let hm = await   doTrade(athing)
                      
  let ahh =  await sendTransaction(hm.connection, hm.tx, [
    wallet,
     // @ts-ignore
    ...hm.signers2,
   ]
   );
console.log(ahh)
              }
            
            }
            
      fs.writeFileSync("liqsample.json", JSON.stringify(
        (opps))
      )
        } catch (err) {
          console.log(err);
        } 
      });
*/
    // for (let order of asks) {
    //   console.log(
    //     order.orderId,
    //     order.price,
    //     order.size,
    //     order.side, // 'buy' or 'sell'
    //   );
    // }

    // fills
  }

  // --------------------------------------- helpers

  async _getTokenBalance(tokenAccPk: PublicKey) {
    const balance = await this.connection.getTokenAccountBalance(tokenAccPk);
    return balance.value.uiAmount;
  }

  async _prepareAndSendTx(
    instructions: TransactionInstruction[],
    signers: web3.Signer[],
  ) {
    const tx = new Transaction().add(...instructions);
    const sig = await sendAndConfirmTransaction(this.connection, tx, signers);
    console.log(sig);
  }

  async _createMintAccount(): Promise<Token> {
    return Token.createMint(
      this.connection,
      this.ownerKp as any,
      this.ownerKp.publicKey,
      null,
      0,
      TOKEN_PROGRAM_ID,
    );
  }

  async _createTokenAccount(mint: Token, owner: PublicKey): Promise<PublicKey> {
    return mint.createAccount(owner);
  }

  async _createAndFundUserAccount(
    mint: Token,
    mintAmount: number,
  ): Promise<PublicKey> {
    const tokenUserPk = await mint.createAccount(this.ownerKp.publicKey);
    await mint.mintTo(tokenUserPk, this.ownerKp.publicKey, [], mintAmount);
    return tokenUserPk;
  }

  async _generateCreateStateAccIx(
    newAccountPubkey: PublicKey,
    space: number,
  ): Promise<TransactionInstruction> {
    return SystemProgram.createAccount({
      programId: this.DEX_PROGRAM_ID,
      fromPubkey: this.ownerKp.publicKey,
      newAccountPubkey,
      space,
      lamports: await this.connection.getMinimumBalanceForRentExemption(space),
    });
  }
}

export function loadKeypairSync(path: string): Keypair {
  const secretKey = JSON.parse(fs.readFileSync(path, 'utf8'));
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

async function play() {
  const bc = new Blockchain();
  bc.ownerKp = await loadKeypairSync('id.json');
  // await bc.loadMarket();
  await bc.printMetrics();
  //
  // await bc.placeBids();
  // await bc.printMetrics();
  //
  // await bc.placeAsks();
  // await bc.printMetrics();
  //
  // await bc.consumeEvents();
  // await bc.printMetrics();
  //
  // await bc.settleFunds();
  // await bc.printMetrics();
}

play();
