"""
엑셀 파일 구조 확인 스크립트
"""

import pandas as pd
import sys

def check_excel_file(filename):
    print(f"\n{'='*60}")
    print(f"파일: {filename}")
    print(f"{'='*60}\n")
    
    try:
        # 엑셀 파일의 모든 시트 이름 확인
        excel_file = pd.ExcelFile(filename)
        print(f"📑 시트 목록: {excel_file.sheet_names}\n")
        
        # 각 시트 확인
        for sheet_name in excel_file.sheet_names:
            print(f"\n--- 시트: {sheet_name} ---")
            df = pd.read_excel(filename, sheet_name=sheet_name)
            print(f"행 수: {len(df)}")
            print(f"컬럼: {list(df.columns)}\n")
            print("처음 3행:")
            print(df.head(3))
            print("\n")
            
            # 브랜드 관련 컬럼 찾기
            for col in df.columns:
                if '브랜드' in str(col) or 'brand' in str(col).lower():
                    print(f"브랜드 컬럼 발견: '{col}'")
                    print(f"고유 값: {df[col].unique()[:10]}")  # 처음 10개만
                    print(f"총 고유 값 개수: {df[col].nunique()}\n")
            
    except Exception as e:
        print(f"❌ 오류: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    files = ['2024.1-12.XLSX', '2025.1-10.XLSX']
    
    for f in files:
        try:
            check_excel_file(f)
        except Exception as e:
            print(f"파일 {f} 처리 실패: {e}")

