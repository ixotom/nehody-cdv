## 

Apify actor na stahování dat z [Centra dopravního výzkumu](https://nehody.cdv.cz/). 
Skript stáhne dataset nehod s účastí vybraného druhu vozidla v zadaném časovém období.   

### Input

   - **dateFrom:** Datum ve formátu: RRRR-MM-DD
   - **dateTo:** Datum ve formátu: RRRR-MM-DD
   - **vehicle:** Druh vozidla:
     - "kolo"
     - "jine nemotorove vozidlo"
     - "kolobezka"

### Output

- Z Apify lze dataset vyexportovat ve formátech:
     JSON, CSV ,XML, Excel, HTML Table, RSS, JSONL

- **Struktura dat:**
```
    "data": {
        "info": { 
            ...zakladní informace o nehodě
         },
        "accidentDetail": { 
            ...detailnější informace o nehodě
        },
        "vehicle-n": { 
            ...informace o n-tém vozidle
            "person-m": { 
                ...informace o n-té osobě ve vozidle
            }
        }
    }
```

