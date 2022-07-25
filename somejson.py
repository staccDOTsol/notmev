import json

import glob
  
with open ('someshit.json', 'r') as f:
    someshit = json.loads(f.read())
someshit = {}
print(len(someshit))
for name in glob.glob('./ha/*.json'):
    print(name)
    with open (name, 'r') as f:
        bla = json.loads(f.read())
        try:
            for b in bla:
                try:

                    if len(b['transaction']['message']['accountKeys']) == 23 :
                        if b['transaction']['message']['accountKeys'][19] == "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin":
                            if b['transaction']['message']['accountKeys'][17] != "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA":
                                go = False 
                                for abc in b['transaction']['message']['instructions']:
                                    if len(abc['accounts']) == 18:
                                        print(abc['programIdIndex'])

                                        go = True 
                                if go:
                                    try:
                                        if b['transaction']['message']['accountKeys'][12] not in someshit[b['transaction']['message']['accountKeys'][17]]:
                                            someshit[b['transaction']['message']['accountKeys'][17]].append (b['transaction']['message']['accountKeys'][12])
                                    except:
                                        someshit[b['transaction']['message']['accountKeys'][17]] = [b['transaction']['message']['accountKeys'][12]]
                                    print(b['transaction']['message']['accountKeys'])
                                    print(len([b['transaction']['message']['accountKeys'][17]]))
                                    with open ('someshit.json', 'w') as f:
                                        f.write(json.dumps(someshit))
                except Exception as e:
                    print(e)
        except Exception as e:
            print(e)
