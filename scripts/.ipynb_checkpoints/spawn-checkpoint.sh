#!/bin/bash

while :
do
OUTPUT=$(ps -ax| grep -cE "getTXsByBlockNumber.sh")

if (( OUTPUT > 24 )); then
    echo "getTXsByBlockNumber is running "$OUTPUT" times"
	#sleep 1
else
    echo "getTXsByBlockNumber is not running"
	
    nohup sh ./getTXsByBlockNumber.sh &

fi

OUTPUT=$(ps -ax| grep -cE "getTXsByBlockNumber.sh")

if (( OUTPUT > 24 )); then
    echo "getTXsByBlockNumber.sh is running "$OUTPUT" times"
    #sleep 1
else
    echo "getTXsByBlockNumber.sh is not running enuff times"

    nohup sh ./getTXsByBlockNumber.sh &
fi


done
