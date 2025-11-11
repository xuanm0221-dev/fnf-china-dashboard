"""
엑셀 파일을 직접 읽어서 구조 파악
"""
import pandas as pd
import json

def analyze_excel_files():
    files = ['2024.1-12.XLSX', '2025.1-10.XLSX']
    
    all_info = {}
    
    for filename in files:
        print(f"\n{'='*80}")
        print(f"파일: {filename}")
        print('='*80)
        
        try:
            # 엑셀 파일 열기
            xls = pd.ExcelFile(filename)
            
            file_info = {
                'sheets': [],
                'filename': filename
            }
            
            print(f"\n시트 목록: {xls.sheet_names}")
            
            for sheet_name in xls.sheet_names:
                print(f"\n{'─'*80}")
                print(f"시트: {sheet_name}")
                print('─'*80)
                
                df = pd.read_excel(filename, sheet_name=sheet_name)
                
                sheet_info = {
                    'name': sheet_name,
                    'rows': len(df),
                    'columns': list(df.columns),
                    'sample_data': []
                }
                
                print(f"\n총 행 수: {len(df)}")
                print(f"컬럼 수: {len(df.columns)}")
                print(f"\n컬럼 목록:")
                for i, col in enumerate(df.columns, 1):
                    print(f"  {i}. {col}")
                
                # 샘플 데이터
                print(f"\n처음 5행 샘플:")
                print(df.head(5).to_string())
                
                # JSON으로 저장할 샘플
                sample = df.head(5).to_dict('records')
                sheet_info['sample_data'] = sample
                
                # 브랜드 관련 컬럼 찾기
                for col in df.columns:
                    if any(keyword in str(col).lower() for keyword in ['브랜드', 'brand', '법인']):
                        unique_vals = df[col].dropna().unique()
                        print(f"\n'{col}' 컬럼의 고유 값:")
                        for val in unique_vals[:20]:  # 최대 20개
                            count = len(df[df[col] == val])
                            print(f"  - {val}: {count}개")
                        sheet_info['brand_column'] = col
                        sheet_info['brands'] = [str(v) for v in unique_vals]
                
                # 월 관련 컬럼 찾기
                for col in df.columns:
                    if any(keyword in str(col).lower() for keyword in ['월', 'month', '날짜', 'date']):
                        unique_vals = df[col].dropna().unique()
                        print(f"\n'{col}' 컬럼의 고유 값:")
                        for val in sorted(unique_vals)[:20]:
                            print(f"  - {val}")
                        sheet_info['month_column'] = col
                        sheet_info['months'] = [str(v) for v in unique_vals]
                
                file_info['sheets'].append(sheet_info)
            
            all_info[filename] = file_info
            
        except Exception as e:
            print(f"\n❌ 오류: {e}")
            import traceback
            traceback.print_exc()
    
    # JSON 파일로 저장
    with open('excel_structure.json', 'w', encoding='utf-8') as f:
        json.dump(all_info, f, ensure_ascii=False, indent=2, default=str)
    
    print(f"\n\n{'='*80}")
    print("✅ 분석 완료! excel_structure.json 파일에 저장되었습니다.")
    print('='*80)
    
    return all_info

if __name__ == "__main__":
    analyze_excel_files()

