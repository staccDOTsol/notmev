import BN from 'bn.js';
import {
  Connection,
  Keypair, LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction, Signer,
  SystemProgram,
  Transaction, TransactionInstruction,
} from '@solana/web3.js';
import {
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Market } from '@project-serum/serum/lib/market';
import { DexInstructions } from '@project-serum/serum/lib';
import {getVaultOwnerAndNonce} from '@project-serum/swap/lib/utils';
import fs from 'fs';

// ============================================================================= bc class

export class Blockchain {
  connection: Connection;
  DEX_PROGRAM_ID = new PublicKey('HYsk1Qc2NryTaMT8qLRRxuYXqt9fEU7aAZCUa17eHgE9');

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

  async initMarket() {
    this.coinMint = await this._createMintAccount();
    this.pcMint = await this._createMintAccount();
    // this.srmMint = new Token(this.connection, new PublicKey('8JuQxz4ESxWHqGvyx2x7ppbX9pifLUqUg7Ye3jAPX9ga'), TOKEN_PROGRAM_ID, this.ownerKp as any);
    // this.msrmMint = new Token(this.connection, new PublicKey('E4NjqsYo7SY3xV2CoR62db4VnWfnEUTBetCWA4qSFw1S'), TOKEN_PROGRAM_ID, this.ownerKp as any);
    // console.log('srm mint is ', this.srmMint.publicKey.toBase58());

    //length taken from here - https://github.com/project-serum/serum-dex/blob/master/dex/crank/src/lib.rs#L1286
    //this holds market state, hence need to fit this data structure - https://github.com/project-serum/serum-dex/blob/master/dex/src/state.rs#L176
    const marketIx = await this._generateCreateStateAccIx(this.marketKp.publicKey, 376 + 12);
    //support few requests at a time, but many (1<<20) events
    const requestQueueIx = await this._generateCreateStateAccIx(this.reqQKp.publicKey, 640 + 12);
    const eventQueueIx = await this._generateCreateStateAccIx(this.eventQKp.publicKey, 1048576 + 12);
    //support 1<<16 bids and asks
    const bidsIx = await this._generateCreateStateAccIx(this.bidsKp.publicKey, 65536 + 12);
    const asksIx = await this._generateCreateStateAccIx(this.asksKp.publicKey, 65536 + 12);

    await this._prepareAndSendTx(
      [marketIx, requestQueueIx, eventQueueIx, bidsIx, asksIx],
      [this.ownerKp, this.marketKp, this.reqQKp, this.eventQKp, this.bidsKp, this.asksKp],
    );
    console.log('created necessary accounts');

    //create the vault signer PDA

    const [vaultSignerPk, vaultSignerNonce] = await getVaultOwnerAndNonce(
      this.marketKp.publicKey,
      this.DEX_PROGRAM_ID,
    );

    // const seeds = [this.marketKp.publicKey.toBuffer(), Buffer.from([vaultSignerNonce, 0, 0, 0, 0, 0, 0, 0])];
    // const created_key = await PublicKey.createProgramAddress(
    //   seeds,
    //   this.DEX_PROGRAM_ID,
    // );
    // console.log('seeds are', seeds);
    // console.log('nonce is ', vaultSignerNonce);
    // console.log('acc is ', this.marketKp.publicKey.toBase58());
    // console.log('created vault signer PDA, at ', vaultSignerPk.toBase58());
    // console.log('created vault signer PDA, at ', vaultSignerPk.toBytes());
    // console.log('created vault signer PDA, at ', created_key.toBase58());
    // console.log('created vault signer PDA, at ', created_key.toBytes());

    //create token accounts
    this.coinVaultPk = await this._createTokenAccount(this.coinMint, vaultSignerPk as any);
    this.pcVaultPk = await this._createTokenAccount(this.pcMint, vaultSignerPk as any);

    this.coinUserPk = await this._createAndFundUserAccount(this.coinMint, 0);
    this.pcUserPk = await this._createAndFundUserAccount(this.pcMint, 5000);
    // this.srmUserPk = await this._createTokenAccount(this.srmMint, this.ownerKp.publicKey);
    // this.msrmUserPk = await this._createTokenAccount(this.msrmMint, this.ownerKp.publicKey);

    this.coinUser2Pk = await this._createAndFundUserAccount(this.coinMint, 1000);
    this.pcUser2Pk = await this._createAndFundUserAccount(this.pcMint, 0);
    // this.srmUser2Pk = await this._createTokenAccount(this.srmMint, this.ownerKp.publicKey);
    // this.msrmUser2Pk = await this._createTokenAccount(this.msrmMint, this.ownerKp.publicKey);

    const initMarketIx = DexInstructions.initializeMarket({
        //dex accounts
        market: this.marketKp.publicKey,
        requestQueue: this.reqQKp.publicKey,
        eventQueue: this.eventQKp.publicKey,
        bids: this.bidsKp.publicKey,
        asks: this.asksKp.publicKey,
        //vaults
        baseVault: this.coinVaultPk,
        quoteVault: this.pcVaultPk,
        //mints
        baseMint: this.coinMint.publicKey,
        quoteMint: this.pcMint.publicKey,
        //rest
        baseLotSize: new BN(1),
        quoteLotSize: new BN(1),
        feeRateBps: new BN(50),
        vaultSignerNonce: vaultSignerNonce,
        quoteDustThreshold: new BN(100),
        programId: this.DEX_PROGRAM_ID,
        // authority = undefined,
        // pruneAuthority = undefined,
      },
    );

    await this._prepareAndSendTx(
      [initMarketIx],
      [this.ownerKp],
    );
    console.log('successfully inited the market at', this.marketKp.publicKey.toBase58());
  }

  async loadMarket() {
    this.market = await Market.load(this.connection, this.marketKp.publicKey, {}, this.DEX_PROGRAM_ID);
    console.log('market loaded');
  }

  async placeBids() {
    await this.market.placeOrder(this.connection, {
        owner: this.ownerKp as any,
        payer: this.pcUserPk,
        side: 'buy',
        price: 120,
        size: 10,
        orderType: 'limit',
      },
    );
    await this.market.placeOrder(this.connection, {
        owner: this.ownerKp as any,
        payer: this.pcUserPk,
        side: 'buy',
        price: 110,
        size: 20,
        orderType: 'limit',
      },
    );
    console.log('placed bids');
  }

  async placeAsks() {
    await this.market.placeOrder(this.connection, {
        owner: this.ownerKp as any,
        payer: this.coinUser2Pk,
        side: 'sell',
        price: 119,
        size: 10,
        orderType: 'limit',
      },
    );
    await this.market.placeOrder(this.connection, {
        owner: this.ownerKp as any,
        payer: this.coinUser2Pk,
        side: 'sell',
        price: 130,
        size: 30,
        orderType: 'limit',
      },
    );
    console.log('placed asks');
  }

  //without this function tokens won't become free
  async consumeEvents() {
    const openOrders = await this.market.findOpenOrdersAccountsForOwner(
      this.connection,
      this.ownerKp.publicKey,
    );
    const consumeEventsIx = this.market.makeConsumeEventsInstruction(
      openOrders.map(oo => oo.publicKey), 100
    )
    await this._prepareAndSendTx(
      [consumeEventsIx],
      [this.ownerKp]
    )
    console.log('consumed events')
  }

  async settleFunds() {
    for (let openOrders of await this.market.findOpenOrdersAccountsForOwner(
      this.connection,
      this.ownerKp.publicKey,
    )) {
      console.log(openOrders)
      if (openOrders.baseTokenFree > new BN(0) || openOrders.quoteTokenFree > new BN(0)) {

        await this.market.settleFunds(
          this.connection,
          this.ownerKp as any,
          openOrders,
          // spl-token accounts to which to send the proceeds from trades
          //todo be careful here - coins go to user1 (buyer), pc go to user2 (Seller)
          // because the owner in this case is the same for the two it's a bit of a mess
          this.coinUserPk,
          this.pcUser2Pk,
        );
      }
    }
    console.log('settled funds');
  }

  async printMetrics() {
    console.log('// ---------------------------------------');
let someblargs = {"EU5HAQ1tuEm9GLFupyd11KceRhXx5B8EBuHC2TrgGuYi": ["9bhB4sXV4P2YWQnPv8HyW3TqTjHc1Qdw6rGk6eBJWYc"], "9UDobra5MHaZ8wsLNYB3i2sLS3AU6WyYocr9QZxw7U6w": ["CwyQtt6xGptR7PaxrrksgqBSRCZ3Zb2GjUYjKD9jH3tf"], "ComputeBudget111111111111111111111111111111": ["58PSLMbX2EbbMYNpwaa2NCACBCWjJpfQgkVnjttfGfp3"], "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1": ["JiTohih34Z8fy5g443vkaqiU9kMFGjhJaRxXriVjdd5"], "2c1Xer9dtXwBZceyiXg9G62insarvVDHDvqbkYu3amNu": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "6HSguUukDH9zqJBm6oAAmFkg1WK9dJ5iLgnppTCM6jHm": ["7HieX75wGpnDP6XzLF6bchVE489buntRYwDGhBBKP9N1"], "GB17mq41BGiijCm4ipp9RxHncYT63hfXeejx68sBNf8R": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "HWHvQhFmJB3NUcu1aihKmrKegfVxBEHzwVX6yZCKEsi1": ["DD9oA9QQgA2J6UZPsCgEnVWAXoPBvAZqmFqrCZtXdsfA"], "5pki97N9a6yEB3YQL3y8gvf4nSWnvEL9V6yms8Amnd9Z": ["8GnqoarPr749mdzfDYYLQjCFm2fW6XuF5Ji4pVPpazeL"], "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8": ["JqeBmmPPD9whYPgS2MreBGTwndsPdi1qMxSTaDeUDi1"], "GAE1cb6pJugv3MyK9oEjuP61tMC9YJZJf61ciGZboH8N": ["CTaa9s2qcp2vnyRwURzZhUC3KgBAqtPWiKNS14NYg779"], "2nAAsYdXF3eTQzaeUQS3fr4o782dDg8L28mX39Wr5j8N": ["7MBLg6oV5phip11YBbJPuq7u38kdzSi9PM3BifKSpLaR"], "DtLc2wkb6ofH3zdXfqhLRkTbdGa7nRbkGGD8zJCGVKvA": ["CTaa9s2qcp2vnyRwURzZhUC3KgBAqtPWiKNS14NYg779"], "EF12rcjTwMy3JTH9RrQP9GdmcYrXWRuzpeDTPqWVbgjn": ["3Nb8WAMJqgoNRMZFnh1z8iwJ1KvLKkgLHPMxz2Hwo4kP"], "CXFcwgehrWq9hXDgt8CmdH9TdbQKnfZveif468ycWeyF": ["9bhB4sXV4P2YWQnPv8HyW3TqTjHc1Qdw6rGk6eBJWYc"], "BTcGwMGid8CGgoPb9NjAafSm8FCrdvYFznRaFCx2j4zC": ["CwyQtt6xGptR7PaxrrksgqBSRCZ3Zb2GjUYjKD9jH3tf"], "Giq75C91VWb5cGsLxSRLmzbzAMn7Kvj1yHTy4w2wVhCK": ["9bhB4sXV4P2YWQnPv8HyW3TqTjHc1Qdw6rGk6eBJWYc"], "DmWE2EfbKKRhmLR1vDt8MaMrkcnMCmMV5xRBkMnNe2z3": ["CwyQtt6xGptR7PaxrrksgqBSRCZ3Zb2GjUYjKD9jH3tf"], "HGegou8R4BDbCFYNTXRnNU4C2fRCMib8qrXc25cKoQ5c": ["CwyQtt6xGptR7PaxrrksgqBSRCZ3Zb2GjUYjKD9jH3tf"], "3y3UC1tXhjsg34kiTs6ueuR11wEh9UDGugJV8f7Df16P": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "pG6noYMPVR9ykNgD4XSNa6paKKGGwciU2LckEQPDoSW": ["8GnqoarPr749mdzfDYYLQjCFm2fW6XuF5Ji4pVPpazeL"], "Dyt1hDcUF1J1ng4475Skm9c24RA5GQR1qRNSq8WMU7ca": ["CTaa9s2qcp2vnyRwURzZhUC3KgBAqtPWiKNS14NYg779"], "EMAQrRTW9iJUbb7eb1pb4GvtFF9hfhF6SrwwQzSfVcJ9": ["CwyQtt6xGptR7PaxrrksgqBSRCZ3Zb2GjUYjKD9jH3tf"], "HdJkCfJPpR2Xqi3NUr2QMvaYSERgaJFASBd9E2pfmRst": ["DD9oA9QQgA2J6UZPsCgEnVWAXoPBvAZqmFqrCZtXdsfA"], "HftKFJJcUTu6xYcS75cDkm3y8HEkGgutcbGsdREDWdMr": ["3PCRwFhHd8tNADpYrJNXndvzvFjgbCj4WiPiDi2yZftU"], "Fv6MY3w7PP7A54cuPQHevQNuwekGy8yksXWioBsyVd42": ["3PCRwFhHd8tNADpYrJNXndvzvFjgbCj4WiPiDi2yZftU"], "41ssKp1gTu2dqxzjnf7Za6gFw9d7iezZ85k2EUeSRf6v": ["EukbaBj3woQiyHq2DzBhJhtz6zUHwdxzhmyD94BrZ8cg"], "HRk9CMrpq7Jn9sh7mzxE8CChHG8dneX9p475QKz4Fsfc": ["DD9oA9QQgA2J6UZPsCgEnVWAXoPBvAZqmFqrCZtXdsfA"], "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA": ["6tW8VxosufrSQBhADuGjjB45BKiMCFuYS63YR7LoizK7"], "EsDTx47jjFACkBhy48Go2W7AQPk4UxtT4765f3tpK21a": ["3PCRwFhHd8tNADpYrJNXndvzvFjgbCj4WiPiDi2yZftU"], "7KN7ioVL6eEfe6Q5wK3Gns2xuhmcxpxwDz9dNjuvNXpY": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "GNk8Qwff4sHFXA15i5hVLPKWfVPjHsYRcjkUKhbZcD9R": ["9bhB4sXV4P2YWQnPv8HyW3TqTjHc1Qdw6rGk6eBJWYc"], "DGwce9bkCLfpXZFQTxiCyUF4Mj2y2PRAQmcapVmHdRSV": ["CwyQtt6xGptR7PaxrrksgqBSRCZ3Zb2GjUYjKD9jH3tf"], "B4sY29HygXSYAr8XA1UDEXSS8U8Wfc2nbmRDeeZmaSnu": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "A9YB486mMTvDLqjKKfenyCZm4PAyTXdCTTwMEh6p9Grk": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "EBcw5fGz3x4dygE1zMmueDrWDkFt2k5Bn8SbpQCX4sCW": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "3PEpVY9eo2yxDcrMAGMgJ3CaDc3aAVMeo2qVuGn7jb9B": ["BefBuFi7LCjEzFDAxWd3DqxtDYmaeJZDV6cqtoGx5EZB"], "E6QeffUMS2y6LZTAwFBQ3kmEjtCdLCcrgQq5zJQZByw": ["7A78sTGeczBU8t6N1ue7km9owsuJ5rn4j1yxjubgJz92"], "VE9WDmpYqT7tG79o18WjAnmmvJXyb6Xn3Q8nrv4U9oY": ["9bmZBYi45rQeBkLryc6e72eQ3bQdQEavRMt1rR6oCtyR"], "GzwX68f1ZF4dKnAJ58RdET8sPvvnYktbDEHmjoGw7Umk": ["3PCRwFhHd8tNADpYrJNXndvzvFjgbCj4WiPiDi2yZftU"], "pPHrhPTCLhxn6HGaPji6NC9mQux5NveFMuqucjr4gw8": ["DD9oA9QQgA2J6UZPsCgEnVWAXoPBvAZqmFqrCZtXdsfA"], "HjJSzUbis6VhBZLCbSFN1YtvWLLdxutb7WEvymCLrBJt": ["DD9oA9QQgA2J6UZPsCgEnVWAXoPBvAZqmFqrCZtXdsfA"], "USDHyeagFLn8Ct6JfQ7CAV9aoecKjwWmWXL6oNNoL7W": ["AuN1J75bHWiPD8ufmQc3LfM8roiPKrvjjjQ1mCQkqrkv"], "YAkoNb6HKmSxQN9L8hiBE5tPJRsniSSMzND1boHmZxe": ["3tGqWvSzEA5o2avQoG29rFuD5v7fycLe4T2iHM6LxcGc"], "J8u8nTHYtvudyqwLrXZboziN95LpaHFHpd97Jm5vtbkW": ["F5m8gNjC6pjynywcbw9kK1miSNJMw1nQGeviWykfCCXd"], "EPPhqysp2Vxmap2p3qvUBH6uqfoGUR3E2pvWr4esxaRN": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "E8cLziZUwsM3VmmUvGC2krXMDc19TzKDStfaoAiGRywE": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "CB3EVeDUTgfnpZ7bJ1C7NPhGyQzSbCmVgjzPKTFXPWsr": ["GunJHfYeNYu6io9riCdx3cE8xGDBwx47DV5Dq1VKuoyb"], "CifsLGM4JU5kbQ7XFuVgLk4Cu48osPHUa8zCEK39W4o8": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "6MhFFDp4qSkbRA3iyBXwrCrNBvNhwaGFHqLcW6XtXU2i": ["GjtTWjJ6hRemHVP48wMxQ9KrhpayYHLwJtsvWP5G8m2P"], "7mn9gxCCJZTbZx4okxB2JNYBSxtHWppBSHhqT8G7QBEF": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "teE55QrL4a4QSfydR9dnHF97jgCfptpuigbb53Lo95g": ["3PCRwFhHd8tNADpYrJNXndvzvFjgbCj4WiPiDi2yZftU"], "6ZCzzWurQcZM1LP1t1rL6SkNBxPs6dUt44UQVM2CWCiR": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "7gVokShRW55W9t4yR4mkmb242RguvWWxGB7KRapcnMxt": ["GqCjKqu26nZFxtgQdENs2mqP4HGBJNDU2QqCeiEAszRx"], "AvWmXPFM695QfmumWz4AM7Ld5Y8DjqzmP4b5ddMqrDmc": ["A6wUfkNyrKMuDv8ajmr37LVYM6M3WfiQ6L5K5vqUh5Yt"], "6TMBDKymEWAGa3rPHsHojkW7GJc6uDExr7FCUXewAn9B": ["4SBcJjRg5Xf4ikpd9RNuTCJdQqmwhAY5HmineogQaApr"], "CaDJsXR8VJcdPXVGmGEBdixtXi4vgQfvnp9RDzjy8bUc": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "6T3yhwcnSHcuLjvc67bqN8h4vD1CoRUj5SGJVRT5ZQn5": ["B3i99r3UC1c1ohCQAJAbBLAhr5HXzu2BBQNoK7SNegmT"], "CQVYe7ZSkDn1Cjic7AXDBKALQNUrtiDXEGKLRmRF6GbH": ["CTaa9s2qcp2vnyRwURzZhUC3KgBAqtPWiKNS14NYg779"], "7v4STigDSMMzFDWbjG6imoqQBHmRzNJjUigHuPWNf37a": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "AuFaEPJLWfPRPJymJWsAeppfoHHe6bacr4Y7RLkQJ3Pk": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "7winDda55nkNctMwJTNfHUvfP3W8cRxtjuVB6XqpALHH": ["2ipgXLPtdP8mYSm7SgsoMhDQDjYTJZ7jBy41ZyUqVMQi"], "qeQC4u5vpo5QMC17V5UMkQfK67vu3DHtBYVT1hFSGCK": ["3PCRwFhHd8tNADpYrJNXndvzvFjgbCj4WiPiDi2yZftU"], "8PSN1CQxfyZ7T4sM3HM3RAgF2Y6VCf4tKSc8xY73Tnq5": ["8GnqoarPr749mdzfDYYLQjCFm2fW6XuF5Ji4pVPpazeL"], "AZG3tFCFtiCqEwyardENBQNpHqxgzbMw8uKeZEw2nRG5": ["GnRpxAWdx4agxtGy3w3CfPRx1k7wcqnZFsEwtjCeMJyK"], "35sxLsgEiQCsvxqZMQHbNzF72MD6WdniLje1vsoRTqne": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "CkdVV6KPJkqPUALpKPCtVGmVxYop9PjZ9v5Ya9TxQv1X": ["GunJHfYeNYu6io9riCdx3cE8xGDBwx47DV5Dq1VKuoyb"], "1cpebCK2LsEKzytXh8YU3PQs6vx5gdYgdY4sqBWXVhP": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "8CFo8bL8mZQK8abbFyypFMwEDd8tVJjHTTojMLgQTUSZ": ["GMJHfti4je12kPmrGJTstx38DB6vDhbeAfEijyGybwxK"], "J5wq9jofsGXe9Pc5sxJFYAvkcKYhAX2SQBP5ZDnFg39c": ["E1Ci9LJTazXGJYhC59w9PvzDdP8sZK3ajwrFH7Tt5X69"], "GBtMKToaMKqYiXrjHA6nV9Lw6XsXj68U3Zoq14uVnAwJ": ["9bhB4sXV4P2YWQnPv8HyW3TqTjHc1Qdw6rGk6eBJWYc"], "XuErbiqKKqpvN2X8qjkBNo2BwNvQp1WZKZTDgxKB95r": ["G9DcT8YTw4L9AAjUUpfPeVYGWiEf5MQskpC6q1zLdy2m"], "EuhmEJj7G83hVjWBj7SfPAuCKggnJr9WWmU7UX6vZvR6": ["3Nb8WAMJqgoNRMZFnh1z8iwJ1KvLKkgLHPMxz2Hwo4kP"], "CBwshtAW1ZXJc3RF5FWXzZPFDhP7dGx1RUiH2mxPnxSe": ["EukbaBj3woQiyHq2DzBhJhtz6zUHwdxzhmyD94BrZ8cg"], "AcczL4YzvDPYEydLpNtYAaaBgiuFaJKiWoRv5Z3Uu3nq": ["EukbaBj3woQiyHq2DzBhJhtz6zUHwdxzhmyD94BrZ8cg"], "27SeRWKGsHNFZqusYobKm7hsayHvEqKK1WeLF5jU7Fpe": ["EukbaBj3woQiyHq2DzBhJhtz6zUHwdxzhmyD94BrZ8cg"], "SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ": ["AuN1J75bHWiPD8ufmQc3LfM8roiPKrvjjjQ1mCQkqrkv"], "5nDMv9YXiqtS4ZuMmvmuWRoSRdjpFeBnzXf9snmmXXHN": ["6QQ2TzykHGrcQhTdPXvhjLRXemsQMAR5QDN86yvNJMZN"], "3MY7cqbgH9DhVRzZGpaFWNsAbRoyXzsHXzMfdjv2hN8G": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "Fn67BFX9SMgPHMPESNkfuNyAF9XCU1RiuFEJ15ghdg7Y": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "A25KGGCVCUm127Dccy5rNx5kBbpam8LKBeKZNgoYUa6X": ["GunJHfYeNYu6io9riCdx3cE8xGDBwx47DV5Dq1VKuoyb"], "4nw65WxtV4HuKQfuwvF5Ln5NbU5WNesALRFm6cb9gKnX": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "ArG7nzWw9xmm9iykkkdW2Ge7gtsrZEhGnnp5opJ8pMSP": ["EukbaBj3woQiyHq2DzBhJhtz6zUHwdxzhmyD94BrZ8cg"], "HoJMpLC152DfFHEP6xyr5FDGLYc4a5qP2veJSKgayBQA": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "3Mrbdvzgz6QxneFPTVUGGq7GRqR5NzjvQs3XqFa2DyuX": ["H7E6F53ifonMW1sGKMmtjH9jEReffBBn5fsPprzW4HyE"], "DNUQGCAvVciYgSWnmxakP9KyLxtYRLohY6A1RKf9V85A": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "wArhdZHvWUt2SR8LHw7xn72TeBXmGs4rFAJ5PSNW1aw": ["AbombUMd8PacrG56wj2e2A8gMcuArDChkZVbYtPuUknh"], "H8xZP4FYw7iWSn931UjhntMyuYPijS9zdRWpBnJ721vf": ["CTaa9s2qcp2vnyRwURzZhUC3KgBAqtPWiKNS14NYg779"], "8gYmWhaMyybWgRY2tm6NCtFrk9YK3yd99PUgLAvcFHWs": ["BTRmtKFCu7QSVNHQJiHbn5xVurtPJv6zuDZZmQAYCivf"], "HT5hhFqAX5JdiHF7YJPqQ8ivVYg6Cifd1U66sZecmPp3": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "ByC5idkRdo2XdU5U6tSoSQmfq6spztUYMaSs2rrcJRPh": ["7RjKEP39cJVedym94HpVaS1MSHN6Kz5yeoFzcLZTreAL"], "Cj9Asoa9k2RzkvP2WHWWzoGHp4qokHMHnQUaAN8jfSx9": ["3R2JQwxorGF8HW7y8iDQQDmbwJEFzopdEwALtrVf5LRF"], "8B4Lvhb3uHf9FduudtJidfyvWioSVf5G8naWjWbnS3L7": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "7MFY9wFNYYqMqTzhapn4NiRgm5ucERfutknzZMhLWkFd": ["BefBuFi7LCjEzFDAxWd3DqxtDYmaeJZDV6cqtoGx5EZB"], "7DqkcVa4n4j7UsBzACgLgozWyjvuhCz6fXdpyY2U5rYB": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "14oA32iyiWEm79JxAnBMWEJHzUtAcZyZrvvEC7uthrK": ["5JesMGUMKLyFa6F3CbT8uPiZbQwYkyYmMJ8X9KRiuvzo"], "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc": ["Huj9PBdKQfgTYE46V7su3xNJ5wWxAAp4Xuih8mkZrZJF"], "arb1wVBsR7MVRh1tt46A199daQE21xh9Kr9jE6u96Pz": ["44PJ3JyrkUvJPDrauYzNAyKV2CB4FHQLKdxf4xX9HyQu"], "J6ULjQv2xpifRQQAKNYAtEGapgAsAA7vNhhRU57Law6m": ["DD9oA9QQgA2J6UZPsCgEnVWAXoPBvAZqmFqrCZtXdsfA"], "Cui38PwHtWyNQMQEy6wJ4HUqUeg41c9SMxzVCYvJtZ7H": ["EukbaBj3woQiyHq2DzBhJhtz6zUHwdxzhmyD94BrZ8cg"], "8FCsvcvGmUqDoPC6qgWr3R6ZR1AyBHNkx4EbMqQpaxTz": ["EukbaBj3woQiyHq2DzBhJhtz6zUHwdxzhmyD94BrZ8cg"], "B4mPxMar7VLvxQ9nQ5JrnrfrvnxURLtGa5g3HA2JjctR": ["EukbaBj3woQiyHq2DzBhJhtz6zUHwdxzhmyD94BrZ8cg"], "CfhpEY1WJ2U156FHY3vWcYdg3iJNjY2pshsBH8TprAUY": ["EukbaBj3woQiyHq2DzBhJhtz6zUHwdxzhmyD94BrZ8cg"], "2EWpVQmhFK1jZLsQVotCQafhuYARnyMirWfpHD1fs4Hq": ["EukbaBj3woQiyHq2DzBhJhtz6zUHwdxzhmyD94BrZ8cg"], "Dg3oAcko5dE5V2dVRjLZG1Y3WPrRYTZGqmQXRdiGggAz": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "yn36xrPhfktB91Yi6kaDp6hSip5vBVEZu81bj5uMXdR": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "yM4PxZXwaJXfZFkc1aAyE7FZp1JSmqnoyd8NRArQNRo": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "3GENsTnKskSBAHDPv8CGkQJqKQBPjKENnY8zUfYitpm6": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "2dc3UgMuVkASzW4sABDjDB5PjFbPTncyECUnZL73bmQR": ["DtTozXkJ6tPpsc8GTf7jdeatdTcZZ9tzpoaFivekyRD7"], "DMdygeyTXQ5Z2BTTUXQiFzQhav7YuTvSUwzD2B3RSBuB": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "Ccw6fUv8mE293y5htFr5BKXmft1Dvfbax3njNCek5Dvu": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "HJXRnwjhtA7Dp1G93Ktg8uKmRXupAKuJmuMve5WtGFrX": ["8fBATAPtusynY1XQwRn8f1xABFrDA2U4Ma7UaWkWtkea"], "93K5XTbsDXQ8CjV6tyvhunLH6Pe4gEgzg4A8yRprLfpm": ["EukbaBj3woQiyHq2DzBhJhtz6zUHwdxzhmyD94BrZ8cg"], "Gz19eE6uZ38WfzPaLxpd6m7E5fgrwGUPupqbXBZE2bRd": ["EukbaBj3woQiyHq2DzBhJhtz6zUHwdxzhmyD94BrZ8cg"], "BjeN1mk1nmivmB71CHKEn57huQ8LmYyR45WRfnCxsdKT": ["3R2JQwxorGF8HW7y8iDQQDmbwJEFzopdEwALtrVf5LRF"], "F4UVHxYw9DGXHqa7mfwrDAT6MdC6fTLoQjZwb6ipvUhc": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "6bhvdkoTfqfmLxiMhTBU9quSVDgRHYhmRbFBpTNQVvxF": ["BNQSz5FNvYNkqVpEdzpGjQuxTsr4BgXybhv1mQ3qApsd"], "2BHwrsAzKnHiv9Z4Y7b2A2Y2jX3ELsnHKwrHDwpnffEj": ["7MBLg6oV5phip11YBbJPuq7u38kdzSi9PM3BifKSpLaR"], "HXgqkq5hn6QxrtJmtPW7igf7G4mrxbqS5c8NQybnxYi2": ["6uM8WrTWFQ1Rpa78xA1aRF1Bhy2MYMShW6uNHtWhqrQv"], "AYt5Ct44gFDrw435XedKJZuSxnkQJDfuuGoL6kA1hU5K": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "CrR234CmXhv4BP8KnZ8WLXy7XyddhH8J6cocobrQhxQC": ["CTaa9s2qcp2vnyRwURzZhUC3KgBAqtPWiKNS14NYg779"], "9ZxhUhPVaQwLhFyxYXKeXdpePqzFtk7heCkq9BjpT8NM": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "AmHqWgr8NwSAn7bPgENs3PZ3HQMntb8arrBga9twNnVB": ["GunJHfYeNYu6io9riCdx3cE8xGDBwx47DV5Dq1VKuoyb"], "CS2USNyRYjDKN7GkjMJyWu8F2nsySW4574C8NYHSD13L": ["GunJHfYeNYu6io9riCdx3cE8xGDBwx47DV5Dq1VKuoyb"], "5CoLzoH5pgxJVGTtXMc9RxvZps5G7W6cEhQLLh9hqMF3": ["2ipgXLPtdP8mYSm7SgsoMhDQDjYTJZ7jBy41ZyUqVMQi"], "2xReN9TCgMtDqGxouiLjdy691q2wTxprRtiV4ksmTJdX": ["3AJqeN43Vte6zwARxefdTKF2vNkVHh5mAguBCpTUtsm9"], "BMiW7rep9eBE2iwpNqMStLdc3beCuHnH39mhMr3UsSpE": ["DrJYZPoB4cbExZGD9pJZGeWKperWHRpTLkV8zJF77kbb"], "5khddzdHJL9aUXDYNJzpJkt5cGgJCQncyGBUM8DPYBri": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "4GUniSDrCAZR3sKtLa1AWC8oyYubZeKJQ8KraQmy3Wt5": ["8GnqoarPr749mdzfDYYLQjCFm2fW6XuF5Ji4pVPpazeL"], "ETNYfGMDeGRBQU8aahYJUXU3HiAmbmoMZTCv21ozBwpy": ["CuzQNvBmuzv5FKGo8yULRyZ5MKWthA7rA3eR35NRHWy6"], "AbDX7fimF32cEKxi1hzhJVHwff4ymxc4iutnyyJoSdts": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "4QMCnu36LbfzhbURAF1JyKZJHy7hSzKjsDtp56CT9zfF": ["EukbaBj3woQiyHq2DzBhJhtz6zUHwdxzhmyD94BrZ8cg"], "6mxHvWVB3X3PzbwmbbfuwaVrNMNWXAdeMcSRrqBa5EcB": ["EukbaBj3woQiyHq2DzBhJhtz6zUHwdxzhmyD94BrZ8cg"], "BGyCGoUUBNjpMx6h77eYcSgpn9j5cB1RM357Vu7VCzCk": ["EukbaBj3woQiyHq2DzBhJhtz6zUHwdxzhmyD94BrZ8cg"], "6FBMyesVL1zW2SC9dK9uoWQmnaQKywGp9DHqJyfDXUho": ["EukbaBj3woQiyHq2DzBhJhtz6zUHwdxzhmyD94BrZ8cg"], "MpaVaxe8o5ZevLfMLVKqfWH3Dd6KaidoEXm3SHqjpe9": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "So11111111111111111111111111111111111111112": ["DaAoRFPZcxCudRFLKSZxED3DacQ4aRTAs6M6j8oGGwZJ"], "9qtKZNVFmty6wbPN8VpDiZdpX4YPn2KD8LEGFt1Kcwdp": ["CTaa9s2qcp2vnyRwURzZhUC3KgBAqtPWiKNS14NYg779"], "Hbrobi1bJSGniUVKjgCaKfATBAF3gQF7xmw4nQfjv5sp": ["2NUdu1L4XEhL5jZT2gEUAhQvYyJiR4wFYdj5FokLvmH5"], "PknPGRn3K3HPzjyaKjSAqDWqXm65TRzQzsSjG6dibPn": ["AY93sHNFfxnhJSdjdGe6mJDGF7iSqzdNpj7yyhrMWC4h"], "8k3EFHxFrKJfYFT8zvKwoC5e5JMC6w2fXeBEMhPDg2FM": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "7EjjM3wxaVR53jw9JwQmwj1q2uML5PY6cyt9dhfwZWoR": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "kK66Q387Urj6ZcCqChXTNRQzxBTzfSfsPqqYFBQs4Pa": ["F5m8gNjC6pjynywcbw9kK1miSNJMw1nQGeviWykfCCXd"], "3Mvf8hoMHLAWLfqHfinyPW4cXreTESV8ehUt1ogsyzth": ["wM7CCy7rwnZJFSVb8cFEffUebT23L3KwzkkNQEwdU1P"], "Hf4siFCMfhWnjSBtEHi7Y8edfLseGzdSuvJ9KKPEr8Tq": ["BFtzGFg6WEvzdq7xoEbfb3uqNR3wQiRpbo88gpnLF6Zs"], "GknSwzJF9VnQsLX1BgrJsSuUt8NUwa2EsYMzWJAB8Pqy": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "5TXTSZpWoVoJpfdf848ov8pj9NYJZ7we9BM746sMUyfF": ["H4Hq9jpjd9uZvnib66wQDeCZzaCjjummYozc71ZNbn2j"], "7kS6BLLxp61sNdDgAjEFbspiFVAYSPPALponc4gxeTtn": ["CXT9Kvn6VdhrmzviNfE5dForbA6PGMQK4HtF3NTGaozT"], "6YpcMmanweNSgWo6b18JeemotCeY3g4CW32K76ahMKbu": ["J72ZyNvEWB53nQg2prGPW1kQ4qdEbFDdxGkiWKfS5Z4Z"], "HHCdnAVywcJ9F8MpS3D9137v5Tg1tZ6gp2mSgYN8Am71": ["6uM8WrTWFQ1Rpa78xA1aRF1Bhy2MYMShW6uNHtWhqrQv"]}
    const url = 'http://localhost:8899';
    this.connection = new Connection("https://solana--mainnet.datahub.figment.io/apikey/24c64e276fc5db6ff73da2f59bac40f2", 'recent');
    for(var ablarg of Object.keys(someblargs)){
    try 
  {
      this.market = await Market.load(this.connection, new PublicKey(ablarg), {}, new PublicKey(someblargs[ablarg]));
    console.log('market loaded');
    let bids = await this.market.loadBids(this.connection);
    let asks = await this.market.loadAsks(this.connection);


    // bids
    console.log('bids are:');
    for (let [price, size] of bids.getL2(1)) {
      console.log(price, size);
    }

    // asks
    console.log('asks are:');
    for (let [price, size] of asks.getL2(1)) {
      console.log(price, size);
    }
  }
   catch (err){
    console.log(err)
   }
  }
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

  async _prepareAndSendTx(instructions: TransactionInstruction[], signers: Signer[]) {
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

  async _createAndFundUserAccount(mint: Token, mintAmount: number): Promise<PublicKey> {
    const tokenUserPk = await mint.createAccount(this.ownerKp.publicKey);
    await mint.mintTo(tokenUserPk, this.ownerKp.publicKey, [], mintAmount);
    return tokenUserPk;
  }

  async _generateCreateStateAccIx(newAccountPubkey: PublicKey, space: number): Promise<TransactionInstruction> {
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
  bc.ownerKp = await loadKeypairSync('/Users/jarettdunn/.config/solana/id.json');

  // await bc.loadMarket();
  await bc.printMetrics();
  await bc.printMetrics();
  await bc.printMetrics();
  await bc.printMetrics();
  await bc.printMetrics();
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
