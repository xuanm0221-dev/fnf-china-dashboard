import pandas as pd
import sys

print("Python version:", sys.version)
print("\nChecking Excel files...")

files = ['2024.1-12.XLSX', '2025.1-10.XLSX']

for f in files:
    try:
        print(f"\n{'='*60}")
        print(f"File: {f}")
        print('='*60)
        
        xls = pd.ExcelFile(f)
        print(f"Sheets: {xls.sheet_names}")
        
        for sheet in xls.sheet_names[:1]:  # 첫 번째 시트만
            df = pd.read_excel(f, sheet_name=sheet)
            print(f"\nSheet: {sheet}")
            print(f"Rows: {len(df)}")
            print(f"Columns: {list(df.columns)}")
            print(f"\nFirst 3 rows:")
            print(df.head(3))
            
    except Exception as e:
        print(f"Error: {e}")

print("\n" + "="*60)
print("Done!")

