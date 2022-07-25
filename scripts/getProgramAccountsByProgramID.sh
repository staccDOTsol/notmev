#!/bin/bash

# This script will take a program ID and find all accounts that implement it.

echo "Enter the RPC node you would like to utilize, press enter to use default:"
#read  RPC_NODE
RPC_NODE=""
echo "Enter a Solana program ID:"
read  PROGRAM_ID

if [$RPC_NODE == ""]; then
    RPC_NODE="https://rpc.theindex.io/mainnet-beta/4ae962ec-5c8c-4071-9ef2-e5c6b59bdf3e"
fi

if [$PROGRAM_ID == ""]; then
    PROGRAM_ID="cndyAnrLdpjq1Ssp1z8xxDsB8dxe7u4HL5Nxi2K5WXZ"
fi

BODY="{
  \"jsonrpc\": \"2.0\",
  \"id\": 1,
  \"method\": \"getProgramAccounts\",
  \"params\": [
    \"${PROGRAM_ID}\",
    {
      \"encoding\": \"jsonParsed\",
      \"filters\": [ ]
    }
  ]
}"

curl $RPC_NODE -X POST -H "Content-Type: application/json" -d $BODY --silent 