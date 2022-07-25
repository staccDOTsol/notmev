#!/bin/bash
#
# This script takes the current block and iterates backwards,
# storing transactions in json form, gzip compressed in the 
# ../transactions/ folder.
#
echo "would you like to configure settings? (y/n)"
read CONFIGURE

if [[ "$CONFIGURE" == "y" ]]; then
  echo "Enter the RPC node you would like to utilize, press enter to use default:"
  read  RPC_NODE
  echo "Enter a block number to iterate backwards from, press enter to use the last block:"
  read  CURRENT_BLOCK_NUMBER
  echo "Enter a block to stop at, press enter to use the hard coded default:"
  read  END_BLOCK_NUMBER

  if [[ END_BLOCK_NUMBER -gt $BLOCK_NUMBER ]]; then
    echo "ERROR: end block number cannot be greater than starting block number"
    echo "exiting..."
    exit
  fi
elif [[ "$CONFIGURE" == "n" ]]; then
# TODO: get current block number
  CURRENT_BLOCK_NUMBER=143019040
  END_BLOCK_NUMBER=$((BLOCK_NUMBER - 50))
  RPC_NODE="https://solana--mainnet.datahub.figment.io/apikey/24c64e276fc5db6ff73da2f59bac40f2"
else
  echo "unexpected input, exitting..."
  exit
fi

# Iterate from $BLOCK_NUMBER backwards to END_BLOCK_NUMBER

while [[ $BLOCK_NUMBER -gt $END_BLOCK_NUMBER ]]
  do
    UNZIPPED_FILE="../transactions/$BLOCK_NUMBER.json"
    ZIPPED_FILE="../transactions/$BLOCK_NUMBER.json.gz"

    if test -f "$UNZIPPED_FILE"; then
        echo "$UNZIPPED_FILE exists, compressing with gzip and skipping this block."
        gzip $UNZIPPED_FILE
        CURRENT_BLOCK_NUMBER=`expr $BLOCK_NUMBER - 1`
        continue
    elif test -f "$ZIPPED_FILE"; then
        echo "$ZIPPED_FILE exists, skipping this block."
        CURRENT_BLOCK_NUMBER=`expr $BLOCK_NUMBER - 1`
        continue
    fi

    # If the  pass and the block hasn't been analyzed yet:
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
      CURRENT_BLOCK_NUMBER=`expr $BLOCK_NUMBER - 1`

      # sleep to avoid rate limiting
      sleep 1
done