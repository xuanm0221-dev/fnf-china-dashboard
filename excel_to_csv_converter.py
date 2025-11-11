"""
엑셀 파일을 브랜드별 CSV로 변환하는 스크립트
2024.1-12.XLSX, 2025.1-10.XLSX 파일을 처리
"""

import pandas as pd
import os
from pathlib import Path
import sys

def convert_excel_to_csv():
    """엑셀 파일을 CSV로 변환"""
    
    # 출력 디렉토리
    output_dir = 'public/data'
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # 엑셀 파일 목록
    excel_files = [
        ('2024.1-12.XLSX', 2024, list(range(1, 13))),  # 1-12월
        ('2025.1-10.XLSX', 2025, list(range(1, 11))),  # 1-10월
    ]
    
    print("\n" + "="*70)
    print("엑셀 데이터 변환 시작")
    print("="*70 + "\n")
    
    for excel_file, year, months in excel_files:
        if not os.path.exists(excel_file):
            print(f"⚠️  파일을 찾을 수 없습니다: {excel_file}\n")
            continue
        
        print(f"\n📂 처리 중: {excel_file}")
        print("-" * 70)
        
        try:
            # 엑셀 파일 읽기
            xls = pd.ExcelFile(excel_file)
            print(f"   시트 목록: {xls.sheet_names}\n")
            
            # 각 시트 처리
            for sheet_name in xls.sheet_names:
                print(f"\n   📄 시트: {sheet_name}")
                df = pd.read_excel(excel_file, sheet_name=sheet_name)
                
                print(f"      - 행 수: {len(df)}")
                print(f"      - 컬럼: {list(df.columns)[:5]}...")  # 처음 5개만
                
                # 데이터 샘플 출력
                if len(df) > 0:
                    print(f"\n      처음 3행 샘플:")
                    print(df.head(3).to_string(index=False))
                
                # 브랜드 컬럼 찾기
                brand_col = None
                for col in df.columns:
                    col_lower = str(col).lower()
                    if '브랜드' in col_lower or 'brand' in col_lower:
                        brand_col = col
                        break
                
                if brand_col is None:
                    print(f"\n      ⚠️  브랜드 컬럼을 찾을 수 없습니다.")
                    print(f"      사용 가능한 컬럼: {list(df.columns)}")
                    continue
                
                print(f"\n      ✅ 브랜드 컬럼: '{brand_col}'")
                unique_brands = df[brand_col].dropna().unique()
                print(f"      브랜드 값: {list(unique_brands)}")
                
                # 월 컬럼 찾기
                month_col = None
                for col in df.columns:
                    col_lower = str(col).lower()
                    if '월' in col_lower or 'month' in col_lower:
                        month_col = col
                        break
                
                # 브랜드별로 분리
                brand_mapping = {
                    'MLB': 'mlb',
                    'MLB Kids': 'mlb-kids',
                    'MLB KIDS': 'mlb-kids',
                    'Discovery': 'discovery',
                    '공통': 'common',
                }
                
                for brand_name, brand_id in brand_mapping.items():
                    # 브랜드 필터링 (대소문자 구분 없이)
                    brand_mask = df[brand_col].astype(str).str.contains(
                        brand_name, case=False, na=False
                    )
                    brand_data = df[brand_mask].copy()
                    
                    if len(brand_data) == 0:
                        continue
                    
                    print(f"\n      🏷️  {brand_name}: {len(brand_data)}개 행")
                    
                    # 월별로 분리
                    if month_col:
                        for month in months:
                            month_data = brand_data[brand_data[month_col] == month].copy()
                            
                            if len(month_data) == 0:
                                continue
                            
                            # 파일명 생성
                            filename = f"sample_{brand_id}_{year}{month:02d}.csv"
                            filepath = os.path.join(output_dir, filename)
                            
                            # CSV로 저장
                            month_data.to_csv(filepath, index=False, encoding='utf-8-sig')
                            print(f"         ✅ {filename} ({len(month_data)}개 행)")
                    else:
                        # 월 컬럼이 없으면 전체 저장
                        filename = f"sample_{brand_id}_{year}_all.csv"
                        filepath = os.path.join(output_dir, filename)
                        brand_data.to_csv(filepath, index=False, encoding='utf-8-sig')
                        print(f"         ✅ {filename} ({len(brand_data)}개 행)")
        
        except Exception as e:
            print(f"\n   ❌ 오류 발생: {str(e)}")
            import traceback
            traceback.print_exc()
    
    print("\n" + "="*70)
    print("✅ 변환 완료!")
    print("="*70)
    print(f"\n📁 생성된 CSV 파일은 '{output_dir}' 폴더에 저장되었습니다.\n")

if __name__ == "__main__":
    try:
        convert_excel_to_csv()
    except KeyboardInterrupt:
        print("\n\n중단되었습니다.")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ 예상치 못한 오류: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

