#!/bin/bash
bla=${1}


while [ $bla -gt $((bla-5000000)) ]

do
echo $bla
nohup bash untitled.sh $bla &
bla=`expr $bla - 10000`
sleep 2
done