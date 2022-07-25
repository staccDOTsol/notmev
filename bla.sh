#!/bin/bash
bla=143019040
while [ $bla -gt 133019040 ]
do 

echo $bla
curl https://solana--mainnet.datahub.figment.io/apikey/24c64e276fc5db6ff73da2f59bac40f2 -X POST -H "Content-Type: application/json" -d '
  {"jsonrpc": "2.0","id":1,"method":"getBlock","params":['$bla', {"encoding": "json","transactionDetails":"full","rewards":false}]}
' | jq -r '.result.transactions' >> "ha/$bla.json"
bla=`expr $bla - 1`
done