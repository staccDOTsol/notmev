import json

import glob
  
with open ('someshit.json', 'r') as f:
    someshit = json.loads(f.read())
someshit = {}
print(len(someshit))
for name in glob.glob('./ha/*.json'):
    print(name)
    try:
        with open (name, 'r') as f:
            bla = json.loads(f.read())
        for b in bla:
            if len(b['transaction']['message']['accountKeys']) == 23 :
                if b['transaction']['message']['accountKeys'][19] == "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin":
                    try:
                        someshit[b['transaction']['message']['accountKeys'][17]].append (b['transaction']['message']['accountKeys'][12])
                    except:
                        someshit[b['transaction']['message']['accountKeys'][17]] = [b['transaction']['message']['accountKeys'][12]]
                    print(len([b['transaction']['message']['accountKeys'][17]]))
                    with open ('someshit.json', 'w') as f:
                        f.write(json.dumps(someshit))
                    print( len(b['transaction']['message']['accountKeys']))
    except:
        print('blah')
