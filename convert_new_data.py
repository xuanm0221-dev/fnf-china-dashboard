"""
재유니 폴더의 2024.csv와 2025.csv를 변환하여 
브랜드별 월별 CSV 파일을 생성하는 스크립트
"""

import pandas as pd
import os
import re
from pathlib import Path

def clean_currency_value(value):
    """
    통화 값을 숫자로 변환 (쉼표 제거, NaN 처리)
    """
    if pd.isna(value):
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    # 문자열인 경우 쉼표 제거
    value_str = str(value).replace(',', '').replace('"', '').strip()
    try:
        return float(value_str)
    except:
        return 0.0

def convert_csv_data(csv_file, year, output_dir='public/data'):
    """
    CSV 파일을 읽어서 브랜드별, 월별로 데이터 변환
    
    Args:
        csv_file: CSV 파일 경로
        year: 연도 (2024 또는 2025)
        output_dir: CSV 파일을 저장할 디렉토리
    """
    # 출력 디렉토리 생성
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    print(f"\n{'='*70}")
    print(f"📂 처리 중: {csv_file}")
    print(f"{'='*70}\n")
    
    # CSV 파일 읽기
    try:
        df = pd.read_csv(csv_file, encoding='utf-8')
    except:
        try:
            df = pd.read_csv(csv_file, encoding='cp949')
        except:
            df = pd.read_csv(csv_file, encoding='euc-kr')
    
    print(f"✅ 데이터 로드 완료: {len(df)}행")
    print(f"📋 컬럼: {list(df.columns)}\n")
    
    # 컬럼명 확인
    brand_col = '사업부(조정)'
    dept_col = '부서명'
    category1_col = '대분류'
    category2_col = '중분류'
    # 2024년은 '소분류', 2025년은 'Cost Elem desc'
    category3_col = 'Cost Elem desc' if 'Cost Elem desc' in df.columns else '소분류'
    
    # 월 컬럼 찾기
    month_cols = [col for col in df.columns if '합계 :' in str(col) or re.match(r'.*202[45]\d{2}', str(col))]
    print(f"📅 월 컬럼 {len(month_cols)}개 발견:")
    for col in month_cols:
        print(f"   - {col}")
    print()
    
    # 사업부 목록 확인 (총합계 제외)
    brands = df[brand_col].unique()
    brands = [b for b in brands if b not in ['총합계', 'nan'] and pd.notna(b)]
    print(f"🏷️  사업부 목록: {list(brands)}\n")
    
    # 브랜드명 매핑 (파일명용)
    brand_mapping = {
        'DX': 'discovery',
        'MLB': 'mlb',
        'MLB Kids': 'mlb-kids',
        'Discovery': 'discovery',
        '공통': 'common'
    }
    
    # 각 월별로 처리
    for month_col in month_cols:
        # 월 추출 (예: "합계 : 202401" -> "202401")
        month_match = re.search(r'(202[45]\d{2})', month_col)
        if not month_match:
            continue
        
        yyyymm = month_match.group(1)
        year_num = yyyymm[:4]
        month_num = yyyymm[4:]
        
        print(f"\n📆 처리 중: {year_num}년 {month_num}월")
        
        # 각 브랜드별로 데이터 분리
        for brand in brands:
            brand_data = df[df[brand_col] == brand].copy()
            
            if len(brand_data) == 0:
                continue
            
            # 해당 월의 데이터만 추출
            result_data = []
            
            for idx, row in brand_data.iterrows():
                value = clean_currency_value(row[month_col])
                
                # 0이 아닌 값만 포함
                if value != 0:
                    result_data.append({
                        '브랜드': brand,
                        '본부': row[dept_col],
                        '팀': row[dept_col],  # 팀과 본부가 같은 것으로 보임
                        '대분류': row[category1_col],
                        '중분류': row[category2_col],
                        '소분류': row[category3_col],
                        '계정과목': row[category3_col],  # 계정과목으로 소분류 사용
                        '금액': value,
                        '년월': yyyymm,
                        '비고': ''
                    })
            
            if len(result_data) > 0:
                # 데이터프레임 생성
                result_df = pd.DataFrame(result_data)
                
                # 파일명 생성
                brand_safe = brand_mapping.get(brand, brand.replace(' ', '_').lower())
                filename = f"cost_{brand_safe}_{yyyymm}.csv"
                filepath = os.path.join(output_dir, filename)
                
                # CSV로 저장
                result_df.to_csv(filepath, index=False, encoding='utf-8-sig')
                print(f"   ✅ {brand}: {filename} ({len(result_df)}개 행)")
    
    print(f"\n{'='*70}")

def main():
    """메인 함수"""
    print("\n" + "="*70)
    print("🚀 2024/2025 데이터 변환 시작")
    print("="*70)
    
    # CSV 파일 처리
    csv_files = [
        ('재유니/2024.csv', 2024),
        ('재유니/2025.csv', 2025)
    ]
    
    total_files = 0
    
    for csv_file, year in csv_files:
        if os.path.exists(csv_file):
            try:
                convert_csv_data(csv_file, year)
                print(f"✅ {csv_file} 처리 완료!\n")
            except Exception as e:
                print(f"\n❌ 오류 발생: {csv_file}")
                print(f"   {str(e)}\n")
                import traceback
                traceback.print_exc()
        else:
            print(f"\n⚠️  파일을 찾을 수 없습니다: {csv_file}\n")
    
    # 생성된 파일 목록 확인
    if os.path.exists('public/data'):
        files = [f for f in os.listdir('public/data') if f.startswith('cost_') and f.endswith('.csv')]
        total_files = len(files)
        print(f"\n📁 총 {total_files}개의 CSV 파일이 생성되었습니다:")
        
        # 브랜드별로 그룹화하여 표시
        from collections import defaultdict
        by_brand = defaultdict(list)
        for f in sorted(files):
            brand = f.split('_')[1]
            by_brand[brand].append(f)
        
        for brand, brand_files in sorted(by_brand.items()):
            print(f"\n   🏷️  {brand.upper()}: {len(brand_files)}개 파일")
            for f in brand_files[:3]:  # 처음 3개만 표시
                print(f"      - {f}")
            if len(brand_files) > 3:
                print(f"      ... 외 {len(brand_files) - 3}개")
    
    print("\n" + "="*70)
    print("✅ 변환 완료!")
    print("="*70)
    print("\n📁 생성된 파일 위치: public/data/")
    print("🌐 다음 단계: npm run dev 실행 후 http://localhost:3000 접속\n")

if __name__ == "__main__":
    main()

