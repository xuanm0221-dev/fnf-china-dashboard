"""
엑셀 파일을 CSV로 변환하는 스크립트
브랜드별(MLB, MLB Kids, Discovery, 공통)로 데이터를 분리하여 저장
"""

import pandas as pd
import os
from pathlib import Path

def clean_and_convert_excel(excel_file, output_dir='public/data'):
    """
    엑셀 파일을 읽어서 브랜드별로 CSV 파일로 변환
    
    Args:
        excel_file: 엑셀 파일 경로
        output_dir: CSV 파일을 저장할 디렉토리
    """
    # 출력 디렉토리 생성
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    print(f"\n{'='*60}")
    print(f"처리 중: {excel_file}")
    print(f"{'='*60}\n")
    
    # 엑셀 파일 읽기 (첫 번째 시트)
    df = pd.read_excel(excel_file, sheet_name=0)
    
    # 데이터 미리보기
    print("📊 데이터 구조:")
    print(f"   - 총 행 수: {len(df)}")
    print(f"   - 컬럼: {list(df.columns)}\n")
    print("📋 데이터 샘플 (처음 5행):")
    print(df.head())
    print("\n")
    
    # 파일명에서 연도 추출
    filename = os.path.basename(excel_file)
    if '2024' in filename:
        year = '2024'
        months = range(1, 13)  # 1-12월
    elif '2025' in filename:
        year = '2025'
        months = range(1, 11)  # 1-10월
    else:
        print(f"❌ 파일명에서 연도를 찾을 수 없습니다: {filename}")
        return
    
    # 브랜드 목록
    brands = ['MLB', 'MLB Kids', 'Discovery', '공통']
    
    # 컬럼명 확인 및 정규화
    print("🔍 컬럼 분석:")
    for col in df.columns:
        print(f"   - '{col}' (타입: {df[col].dtype})")
    print("\n")
    
    # 브랜드 컬럼 찾기 (대소문자 무시)
    brand_col = None
    for col in df.columns:
        if '브랜드' in str(col).lower() or 'brand' in str(col).lower():
            brand_col = col
            break
    
    if brand_col is None:
        print("⚠️  '브랜드' 컬럼을 찾을 수 없습니다. 첫 번째 컬럼을 브랜드로 가정합니다.")
        brand_col = df.columns[0]
    
    print(f"✅ 브랜드 컬럼: '{brand_col}'")
    print(f"   브랜드 값: {df[brand_col].unique()}\n")
    
    # 월별로 데이터 분리 (월 컬럼이 있다고 가정)
    month_col = None
    for col in df.columns:
        if '월' in str(col) or 'month' in str(col).lower():
            month_col = col
            break
    
    # 각 브랜드별로 처리
    for brand in brands:
        print(f"\n🏷️  처리 중: {brand}")
        
        # 브랜드 필터링
        brand_data = df[df[brand_col].str.contains(brand, na=False, case=False)]
        
        if len(brand_data) == 0:
            print(f"   ⚠️  '{brand}' 데이터가 없습니다.")
            continue
        
        print(f"   - 총 {len(brand_data)}개 행 발견")
        
        # 월별로 분리하여 저장
        if month_col:
            for month in months:
                month_data = brand_data[brand_data[month_col] == month]
                
                if len(month_data) == 0:
                    continue
                
                # 파일명 생성
                brand_safe = brand.replace(' ', '_').lower()
                filename = f"cost_{brand_safe}_{year}{month:02d}.csv"
                filepath = os.path.join(output_dir, filename)
                
                # CSV로 저장
                month_data.to_csv(filepath, index=False, encoding='utf-8-sig')
                print(f"   ✅ 저장: {filename} ({len(month_data)}개 행)")
        else:
            # 월 컬럼이 없으면 전체 데이터를 하나의 파일로 저장
            print("   ⚠️  '월' 컬럼을 찾을 수 없습니다. 전체 데이터를 하나의 파일로 저장합니다.")
            brand_safe = brand.replace(' ', '_').lower()
            filename = f"cost_{brand_safe}_{year}_all.csv"
            filepath = os.path.join(output_dir, filename)
            brand_data.to_csv(filepath, index=False, encoding='utf-8-sig')
            print(f"   ✅ 저장: {filename} ({len(brand_data)}개 행)")

def main():
    """메인 함수"""
    print("\n" + "="*60)
    print("🚀 엑셀 데이터 변환 시작")
    print("="*60)
    
    # 엑셀 파일 목록
    excel_files = [
        '2024.1-12.XLSX',
        '2025.1-10.XLSX'
    ]
    
    # 각 파일 처리
    for excel_file in excel_files:
        if os.path.exists(excel_file):
            try:
                clean_and_convert_excel(excel_file)
            except Exception as e:
                print(f"\n❌ 오류 발생: {excel_file}")
                print(f"   {str(e)}\n")
        else:
            print(f"\n⚠️  파일을 찾을 수 없습니다: {excel_file}\n")
    
    print("\n" + "="*60)
    print("✅ 변환 완료!")
    print("="*60)
    print("\n📁 생성된 CSV 파일은 'public/data/' 폴더에 저장되었습니다.\n")

if __name__ == "__main__":
    main()

