import pandas as pd
import sys

try:
    file_path = "FR-GDO-009 -  Formato Bitácora Disponibilidad de productos.xlsx"
    xls = pd.read_excel(file_path, sheet_name=None, header=None)
    for sheet_name, df in xls.items():
        print(f"========== Sheet: {sheet_name} ==========")
        print("First 15 rows:")
        for index, row in df.head(15).iterrows():
            print(f"Row {index}: {row.to_dict()}")
        print("\n")
except Exception as e:
    print(f"Error: {e}")
