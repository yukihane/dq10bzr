#! /usr/bin/python3
# -*- coding: utf-8 -*-

# bazaar_searching_conditions.ods の "錬金効果" シートを tsv 形式で保存して
# このスクリプトに読み込ませます

import sys
import csv

filename = sys.argv[1]
f = open(filename, "r")
reader = csv.reader(f, delimiter = "\t")
next(reader)
isFirst = True

print('{')
for elm in reader:
  if elm[1]:
    if isFirst:
      isFirst = False
    else:
      print('  ,')
    print('  "' + elm[1] + '": {')
    print('    "id": ' + elm[1] + ',')
    print('    "name": "' + elm[0] + '",')
    print('    "scale": ' + elm[2] + ',')
    print('    "min": ' + elm[3] + ',')
    print('    "max": ' + elm[4] + ',')
    print('    "tickInv": ' + str(int(1/float(elm[5]))) )
    print('  }')
print('}')

f.close()
