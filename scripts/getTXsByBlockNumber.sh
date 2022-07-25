#!/bin/bash
#
# This script takes the current block and iterates backwards,
# storing transactions in json form, gzip compressed in the 
# ../transactions/ folder.
#

echo "Enter a block to iterate backwards from, press enter to use the last block:"

read  BLOCK_NUMBER
echo $BLOCK_NUMBER

if [[ "$BLOCK_NUMBER" == "" ]]; then
 BLOCK_NUMBER=143019040
fi 

RPC_NODE="https://solana--mainnet.datahub.figment.io/apikey/24c64e276fc5db6ff73da2f59bac40f2"

while [ $BLOCK_NUMBER -gt 133019040 ]
do 
  UNZIPPED_FILE="../transactions/$BLOCK_NUMBER.json"
  ZIPPED_FILE="../transactions/$BLOCK_NUMBER.json.gz"

  if test -f "$UNZIPPED_FILE"; then
      echo "$UNZIPPED_FILE exists, compressing with gzip and skipping this block."
      gzip $UNZIPPED_FILE
      BLOCK_NUMBER=`expr $BLOCK_NUMBER - 1`
      continue
  elif test -f "$ZIPPED_FILE"; then
      echo "$ZIPPED_FILE exists, skipping this block."
      BLOCK_NUMBER=`expr $BLOCK_NUMBER - 1`
      continue
  fi

  # If the above checks pass and the block hasn't been analyzed yet: 

    echo "REQUESTING BLOCK:" $BLOCK_NUMBER

    # Curl rpc requesting each block, parse tx's into an array in ../transactions/$BLOCK_NUMBER.json.
    curl $RPC_NODE \
      --silent \
      --request POST \
      --header "Content-Type: application/json" \
      --data '{"jsonrpc": "2.0","id":1,"method":"getBlock","params":['$BLOCK_NUMBER', {"encoding": "json","transactionDetails":"full","rewards":false}]}' \
      | jq --raw-output '.result.transactions' >> $UNZIPPED_FILE
    
    # gzip the unzipped file containing txs and remove the uncompressed version
    gzip $UNZIPPED_FILE

    # iterate block number
    BLOCK_NUMBER=`expr $BLOCK_NUMBER - 1`
    
    # sleep to avoid rate limiting
    sleep 1

done