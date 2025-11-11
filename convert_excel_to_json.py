"""
엑셀 파일을 직접 읽어서 JSON으로 변환
브랜드별로 데이터 분리
"""
import pandas as pd
import json
import os
from pathlib import Path

def convert_excel_to_json():
    """엑셀 파일을 JSON으로 변환"""
    
    output_dir = 'public/data'
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    print("\n" + "="*80)
    print("엑셀 데이터를 JSON으로 변환 시작")
    print("="*80 + "\n")
    
    # 2024년 데이터
    print("📂 2024년 데이터 처리 중...")
    df_2024 = pd.read_excel('2024.1-12.XLSX', sheet_name='2024년')
    
    # 2025년 데이터  
    print("📂 2025년 데이터 처리 중...")
    df_2025 = pd.read_excel('2025.1-10.XLSX', sheet_name='2025년')
    
    # 컬럼명 확인
    print(f"\n2024년 컬럼: {list(df_2024.columns)}")
    print(f"2025년 컬럼: {list(df_2025.columns)}")
    
    # 브랜드별로 데이터 분리
    brand_mapping = {
        'MLB': 'mlb',
        'MLB Kids': 'mlb-kids', 
        'Discovery': 'discovery',
        '공통': 'common'
    }
    
    all_data = {}
    
    for brand_name, brand_id in brand_mapping.items():
        print(f"\n🏷️  {brand_name} 데이터 처리 중...")
        
        brand_data = []
        
        # 2024년 데이터 처리
        if '사업부' in df_2024.columns:
            df_2024_brand = df_2024[df_2024['사업부'] == brand_name].copy()
            
            for _, row in df_2024_brand.iterrows():
                # 각 월별로 데이터 생성
                for month in range(1, 13):
                    month_col = f'2024{month:02d}'
                    if month_col in df_2024.columns:
                        amount_str = str(row[month_col])
                        # 쉼표 제거하고 숫자로 변환
                        try:
                            amount = float(amount_str.replace(',', '')) if amount_str and amount_str != 'nan' else 0
                        except:
                            amount = 0
                        
                        if amount != 0:  # 0이 아닌 데이터만 저장
                            brand_data.append({
                                '브랜드': brand_name,
                                '본부': str(row.get('Cost ctr desc', '')),
                                '팀': str(row.get('부서명', '')),
                                '계정과목': str(row.get('대분류', '')),
                                '상세계정': str(row.get('중분류', '')),
                                '금액': amount,
                                '연월': f'2024-{month:02d}',
                                '비고': ''
                            })
        
        # 2025년 데이터 처리 (1-10월)
        if '사업부' in df_2025.columns:
            df_2025_brand = df_2025[df_2025['사업부'] == brand_name].copy()
            
            for _, row in df_2025_brand.iterrows():
                for month in range(1, 11):  # 1-10월만
                    month_col = f'2025{month:02d}'
                    if month_col in df_2025.columns:
                        amount_str = str(row[month_col])
                        try:
                            amount = float(amount_str.replace(',', '')) if amount_str and amount_str != 'nan' else 0
                        except:
                            amount = 0
                        
                        if amount != 0:
                            brand_data.append({
                                '브랜드': brand_name,
                                '본부': str(row.get('Cost ctr desc', '')),
                                '팀': str(row.get('부서명', '')),
                                '계정과목': str(row.get('대분류', '')),
                                '상세계정': str(row.get('중분류', '')),
                                '금액': amount,
                                '연월': f'2025-{month:02d}',
                                '비고': ''
                            })
        
        all_data[brand_id] = brand_data
        print(f"   ✅ {len(brand_data)}개 데이터 생성")
    
    # JSON 파일로 저장
    output_file = os.path.join(output_dir, 'cost_data.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*80}")
    print(f"✅ 변환 완료!")
    print(f"📁 파일 저장: {output_file}")
    print(f"{'='*80}\n")
    
    # 통계 출력
    print("📊 브랜드별 데이터 통계:")
    for brand_id, data in all_data.items():
        print(f"   - {brand_id}: {len(data):,}개")
    
    return all_data

if __name__ == "__main__":
    try:
        convert_excel_to_json()
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()

