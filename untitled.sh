#!/bin/bash
bla=${1}
echo $bla
while [ $bla -gt $((bla-10000)) ]
do 

echo $bla
curl https://solana--mainnet.datahub.figment.io/apikey/fff8d9138bc9e233a2c1a5d4f777e6ad -X POST -H "Content-Type: application/json" -d '
  {"jsonrpc": "2.0","id":1,"method":"getBlock","params":['$bla', {"encoding": "json","transactionDetails":"full","rewards":false}]}
' | jq -r '.result.transactions' >> "ha/$bla.json"
bla=`expr $bla - 1`
done