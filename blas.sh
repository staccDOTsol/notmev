#!/bin/bash
bla=${1}
oldbla=${1}

while [ $bla -gt $((oldbla-5000000)) ]
                         
do
echo $bla
nohup bash untitled.sh $bla &
bla=`expr $bla - 100000`

done
