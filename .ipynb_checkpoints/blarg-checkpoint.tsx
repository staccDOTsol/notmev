// todo: ok we need teh account balances from your top level tokens. Or fuck off
// prettier be damned

import {Connection,Account, Keypair, LAMPORTS_PER_SOL, PublicKey} from "@solana/web3.js";
import fs from 'fs'
import * as anchor from '@project-serum/anchor'
let doOulala = true
const numberFormater = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
let tasties = []
export const formatNumber = {
  format: (val?: number) => {
    if (!val) {
      return '--';
    }

    return numberFormater.format(val);
  },
  asNumber: (val?: anchor.BN) => {
    if (!val) {
      return undefined;
    }

    return val.toNumber() ;
  },
};
async function oulala(){
  if (doOulala){
    doOulala = false
let oops : number 
let oldoops : number = -1

const connection =  new Connection("https://solana--mainnet.datahub.figment.io/apikey/24c64e276fc5db6ff73da2f59bac40f2", "recent");


let thds =JSON.parse((await fs.readFileSync('someshit.json')).toString())//["9BVcYqEQxyccuwznvxXqDkSJFavvTyheiTYk231T1A8S", "xns66Y3kLdMA7aVZciP5pdc46oBD9QHjUrnfTVF3PWp", "CUG8UvhW1q6ojQC2gyga8x67nde37vvsJUUbinTaPU9N", "FG3z1H2BBsf5ekEAxSc1K6DERuAuiXpSdUGkYecQrP5v", "6BGyecgZHfHfsdG3zp8CuXtxpPxgP6TCJ9j9xhoAoSVV", "3uaZBfHPfmpAHW7dsimC1SnyR61X4bJqQZKWmRSCXJxv", "GBWgHXLf1fX4J1p5fAkQoEbnjpgjxUtr4mrVgtj9wW8a", "GpthK93KvWgQddsBUpuhJcLRxNn5XpEUx9omSUTjtBjV", "9dEVMESKXcMQNndoPc5ji9iTeDJ9GfToboy8prkZeT96", "4BRTPsziQ1QcKtsqAiXjnJe5rASuu41VXF1Bt5zpHqJs", "BzWVwPTEzreNUYMvNdo8JTVWvvk1AM5FRRM7kGn5ohR", "GXZhuCYFVauwV4R9zxr7CuhNUo6bFLFcsMM233k9pdef", "AemfESsxuPJ7TLNekWmu7EMnAKvLqJDJYVXoLtVPDNxs", "Ak2MKrobQ2TEsEzZD5m7cHQtUimJUDFeuw2QEwWjuSqs", "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", "F8Vyqk3unwxkXukZFQeYyGmFfTG3CAX4v24iyrjEYBJV", "26hKhwGrpPabhMS4F2s7LixnycMZhJEcegBvxr7n4LbY", "GVV4ZT9pccwy9d17STafFDuiSqFbXuRTdvKQ1zJX6ttX", "A8usWoqPVRo1G5t82M5WxKFzMCZqAEuJkJKxLCwkzH8J", "x1vRSsrhXkSn7xzJfu9mYP2i19SPqG1gjyj3vUWhim1"]

for (var thd of Object.keys(thds)){  
    console.log(thd)
const hydras = await connection.getProgramAccounts(
       new PublicKey(thd) as PublicKey,
      {}
    );
    console.log(hydras)
}}
doOulala = true

}
  

setInterval(async function(){
oulala()
}, 1.38 * 1000)

setInterval(async function(){
doOulala = true
}, 1.38 * 1000 * 60 * 60 * 1.38)
setTimeout(async function(){
oulala()
}, 1);
