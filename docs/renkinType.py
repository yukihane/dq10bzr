#! /usr/bin/python3
# -*- coding: utf-8 -*-

# bazaar_searching_conditions.ods の "錬金効果" シートを tsv 形式で保存して
# このスクリプトに読み込ませます

import sys
import csv
import json

filename = sys.argv[1]
f = open(filename, "r")
reader = csv.reader(f, delimiter = "\t")
next(reader)
smallCategoryIds = next(reader)[6:]

# 錬金の種類
renkinTypes = {}

# それぞれの装備に付与できる錬金
renkinSet = {}


isFirst = True

for elm in reader:
  if elm[1]:
    data = {"id": int(elm[1]), "name": elm[0], "scale": int(elm[2]),
      "min": float(elm[3]), "max": float(elm[4]), "step": float(elm[5])}
    renkinTypes[elm[1]] = data

    renkinable = elm[6:]
    for i, e in enumerate(renkinable):
      if e:
        key = smallCategoryIds[i]
        if key in renkinSet:
          renkinSet[key].append(elm[1])
        else:
          renkinSet[key] = [elm[1]]
        

f.close()

f = open("renkinTypeSet.json", "w")
f.write(json.dumps(renkinTypes, sort_keys=True, indent=2, ensure_ascii=False))
f.close()

f = open("enableRenkinSet.json", "w")
f.write(json.dumps(renkinSet, sort_keys=True, indent=2))
f.close()

