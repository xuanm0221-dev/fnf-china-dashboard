"""
엑셀 데이터를 JSON으로 최종 변환
"""
import pandas as pd
import json
import os

print("="*80)
print("엑셀 데이터 변환 시작")
print("="*80)

# 출력 디렉토리
os.makedirs('public/data', exist_ok=True)

all_data = {
    'mlb': [],
    'mlb-kids': [],
    'discovery': [],
    'common': []
}

# 2024년 데이터
print("\n2024년 데이터 처리 중...")
df_2024 = pd.read_excel('2024.1-12.XLSX', sheet_name='2024년')
print(f"행 수: {len(df_2024)}")

# 2025년 데이터
print("2025년 데이터 처리 중...")
df_2025 = pd.read_excel('2025.1-10.XLSX', sheet_name='2025년')
print(f"행 수: {len(df_2025)}")

# 브랜드 매핑
brand_map = {
    'MLB': 'mlb',
    'MLB Kids': 'mlb-kids',
    'Discovery': 'discovery',
    '공통': 'common'
}

# 2024년 처리
for brand_name, brand_id in brand_map.items():
    print(f"\n{brand_name} 처리 중...")
    
    # 브랜드 필터링
    df_brand = df_2024[df_2024['사업부'] == brand_name]
    print(f"  2024년: {len(df_brand)}개 행")
    
    count = 0
    for _, row in df_brand.iterrows():
        for month in range(1, 13):
            col = f'2024{month:02d}'
            if col in df_2024.columns:
                val = row[col]
                try:
                    amount = float(str(val).replace(',', '')) if pd.notna(val) else 0
                except:
                    amount = 0
                
                if amount != 0:
                    all_data[brand_id].append({
                        '브랜드': brand_name,
                        '본부': str(row.get('Cost ctr desc', '')),
                        '팀': str(row.get('부서명', '')),
                        '계정과목': str(row.get('대분류', '')),
                        '금액': amount,
                        '연월': f'2024-{month:02d}'
                    })
                    count += 1
    
    # 2025년 처리
    df_brand = df_2025[df_2025['사업부'] == brand_name]
    print(f"  2025년: {len(df_brand)}개 행")
    
    for _, row in df_brand.iterrows():
        for month in range(1, 11):
            col = f'2025{month:02d}'
            if col in df_2025.columns:
                val = row[col]
                try:
                    amount = float(str(val).replace(',', '')) if pd.notna(val) else 0
                except:
                    amount = 0
                
                if amount != 0:
                    all_data[brand_id].append({
                        '브랜드': brand_name,
                        '본부': str(row.get('Cost ctr desc', '')),
                        '팀': str(row.get('부서명', '')),
                        '계정과목': str(row.get('대분류', '')),
                        '금액': amount,
                        '연월': f'2025-{month:02d}'
                    })
                    count += 1
    
    print(f"  총 {count:,}개 데이터")

# JSON 저장
output_file = 'public/data/cost_data.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(all_data, f, ensure_ascii=False, indent=2)

print(f"\n{'='*80}")
print(f"✅ 완료! {output_file} 저장됨")
print(f"{'='*80}")

# 통계
print("\n📊 브랜드별 데이터:")
for bid, data in all_data.items():
    print(f"  {bid}: {len(data):,}개")

