import json

import glob
  
with open ('someshit.json', 'r') as f:
    someshit = json.loads(f.read())
someshit = {}
print(len(someshit))
import gzip


for name in glob.glob('./transactions/*.json.gz'):
    print(name)
    try:
        with gzip.open(name, 'rb') as f:
            
            bla = json.loads(f.read())
            try:
                for b in bla:
                    try:

                        if b['transaction']['message']['accountKeys'][-3] == "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin":
                            go = True
                            if go:
                                try:
                                    if b['transaction']['message']['accountKeys'][0] not in someshit[b['transaction']['message']['accountKeys'][[-6]]]:
                                        someshit[b['transaction']['message']['accountKeys'][-6]].append (b['transaction']['message']['accountKeys'][0])
                                except:
                                    someshit[b['transaction']['message']['accountKeys'][-6]] = [b['transaction']['message']['accountKeys'][0]]
                                print(b['transaction']['message']['accountKeys'])
                                print(len([b['transaction']['message']['accountKeys'][-6]]))
                                with open ('someshit.json', 'w') as f:
                                    f.write(json.dumps(someshit))
                    except Exception as e:
                        print(e)
            except Exception as e:
                print(e)
    except:
        abc=123