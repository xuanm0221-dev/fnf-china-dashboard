"""
엑셀 데이터를 JSON으로 변환 (로그 포함)
"""
import pandas as pd
import json
import os
import sys
from pathlib import Path

# 로그 파일 열기
log_file = open('conversion_log.txt', 'w', encoding='utf-8')

def log(msg):
    print(msg)
    log_file.write(msg + '\n')
    log_file.flush()

try:
    log("\n" + "="*80)
    log("엑셀 데이터를 JSON으로 변환 시작")
    log("="*80 + "\n")
    
    output_dir = 'public/data'
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # 2024년 데이터
    log("📂 2024년 데이터 읽는 중...")
    df_2024 = pd.read_excel('2024.1-12.XLSX', sheet_name='2024년')
    log(f"   행 수: {len(df_2024)}")
    log(f"   컬럼: {list(df_2024.columns)[:10]}...")
    
    # 2025년 데이터  
    log("\n📂 2025년 데이터 읽는 중...")
    df_2025 = pd.read_excel('2025.1-10.XLSX', sheet_name='2025년')
    log(f"   행 수: {len(df_2025)}")
    log(f"   컬럼: {list(df_2025.columns)[:10]}...")
    
    # 브랜드 컬럼 확인
    if '사업부' in df_2024.columns:
        log(f"\n✅ '사업부' 컬럼 발견!")
        unique_brands = df_2024['사업부'].dropna().unique()
        log(f"   고유 값: {list(unique_brands)}")
    else:
        log(f"\n❌ '사업부' 컬럼을 찾을 수 없습니다.")
        log(f"   사용 가능한 컬럼: {list(df_2024.columns)}")
    
    # 브랜드별로 데이터 분리
    brand_mapping = {
        'MLB': 'mlb',
        'MLB Kids': 'mlb-kids', 
        'Discovery': 'discovery',
        '공통': 'common'
    }
    
    all_data = {}
    
    for brand_name, brand_id in brand_mapping.items():
        log(f"\n🏷️  {brand_name} 데이터 처리 중...")
        
        brand_data = []
        
        # 2024년 데이터 처리
        df_2024_brand = df_2024[df_2024['사업부'] == brand_name].copy()
        log(f"   2024년: {len(df_2024_brand)}개 행")
        
        for _, row in df_2024_brand.iterrows():
            for month in range(1, 13):
                month_col = f'2024{month:02d}'
                if month_col in df_2024.columns:
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
                            '연월': f'2024-{month:02d}',
                            '비고': ''
                        })
        
        # 2025년 데이터 처리
        df_2025_brand = df_2025[df_2025['사업부'] == brand_name].copy()
        log(f"   2025년: {len(df_2025_brand)}개 행")
        
        for _, row in df_2025_brand.iterrows():
            for month in range(1, 11):
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
        log(f"   ✅ 총 {len(brand_data):,}개 데이터 생성")
    
    # JSON 파일로 저장
    output_file = os.path.join(output_dir, 'cost_data.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    
    log(f"\n{'='*80}")
    log(f"✅ 변환 완료!")
    log(f"📁 파일 저장: {output_file}")
    log(f"{'='*80}\n")
    
    # 통계 출력
    log("📊 브랜드별 데이터 통계:")
    for brand_id, data in all_data.items():
        log(f"   - {brand_id}: {len(data):,}개")
    
except Exception as e:
    log(f"\n❌ 오류 발생: {e}")
    import traceback
    log(traceback.format_exc())
finally:
    log_file.close()
    print("\n로그 파일: conversion_log.txt")

