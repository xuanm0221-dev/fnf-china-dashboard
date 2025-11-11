"""
엑셀 비용 데이터 정제 스크립트
2024년, 2025년 데이터를 웹 대시보드용 형식으로 변환합니다.
"""

import pandas as pd
import os
from datetime import datetime

# 파일 경로 설정
INPUT_DIR = r"d:\OneDrive - F&F\바탕 화면\hmcursor"
OUTPUT_DIR = r"C:\Users\AD0815\cost-dashboard\public\data"
FILE_2024 = "2024.1-12.XLSX"
FILE_2025 = "2025.1-10.XLSX"

# 출력 디렉토리 생성
os.makedirs(OUTPUT_DIR, exist_ok=True)

def clean_amount(value):
    """금액 데이터 정제 (쉼표 제거 및 숫자 변환)"""
    if pd.isna(value) or value == 0:
        return 0
    if isinstance(value, str):
        # 쉼표 제거
        value = value.replace(',', '')
    try:
        return float(value)
    except:
        return 0

def process_excel_file(file_path, sheet_name, year):
    """엑셀 파일을 읽어서 월별로 분리하여 정제"""
    print(f"\n{'='*60}")
    print(f"처리 중: {file_path}")
    print(f"{'='*60}")
    
    # 엑셀 파일 읽기
    df = pd.read_excel(file_path, sheet_name=sheet_name)
    
    print(f"✓ 파일 로드 완료: {len(df)}행")
    print(f"✓ 컬럼: {list(df.columns)}")
    
    # 컬럼명 정리
    df.columns = df.columns.str.strip()
    
    # 헤더 행 제거 (첫 번째 행이 헤더)
    if df.iloc[0]['Cost ctr'] == 'Cost ctr':
        df = df.iloc[1:].reset_index(drop=True)
    
    # 월별 컬럼 찾기 (YYYYMM 형식)
    month_columns = [col for col in df.columns if str(col).isdigit() and len(str(col)) == 6]
    month_columns.sort()
    
    print(f"✓ 발견된 월별 컬럼: {month_columns}")
    
    # 각 월별로 데이터 변환
    monthly_data = []
    
    for month_col in month_columns:
        year_month = str(month_col)
        year_str = year_month[:4]
        month_str = year_month[4:6]
        
        print(f"\n처리 중: {year_str}년 {month_str}월...")
        
        # 해당 월의 데이터만 추출
        month_df = df[['Cost ctr', 'Cost ctr desc', 'Cost Elem', 'Cost Elem desc', 
                       month_col, 'CURR', '사용여부', '영업비구분', '사업부', '부서명', 
                       '대분류', '중분류']].copy()
        
        # 컬럼명 변경
        month_df.columns = ['코스트센터', '법인', '계정과목코드', '계정과목', 
                           '금액', '통화', '사용여부', '영업비구분', '사업부', '본부', 
                           '대분류', '팀']
        
        # 금액 정제
        month_df['금액'] = month_df['금액'].apply(clean_amount)
        
        # 사용여부가 '사용'인 데이터만 필터링
        month_df = month_df[month_df['사용여부'] == '사용'].copy()
        
        # 금액이 0이 아닌 데이터만
        month_df = month_df[month_df['금액'] != 0].copy()
        
        # 월 정보 추가
        month_df['년월'] = f"{year_str}-{month_str}"
        month_df['년'] = year_str
        month_df['월'] = month_str
        
        # 불필요한 컬럼 제거
        month_df = month_df.drop(['코스트센터', '계정과목코드', '통화', '사용여부'], axis=1)
        
        # 컬럼 순서 재정렬
        month_df = month_df[['년월', '년', '월', '법인', '본부', '팀', '계정과목', 
                            '금액', '영업비구분', '사업부', '대분류']]
        
        print(f"  ✓ 정제 완료: {len(month_df)}행")
        
        # 월별 파일로 저장
        output_file = os.path.join(OUTPUT_DIR, f"cost_{year_month}.csv")
        month_df.to_csv(output_file, index=False, encoding='utf-8-sig')
        print(f"  ✓ 저장 완료: {output_file}")
        
        monthly_data.append(month_df)
    
    # 전체 데이터 통합
    all_data = pd.concat(monthly_data, ignore_index=True)
    
    return all_data, len(month_columns)

def generate_summary(all_data):
    """데이터 요약 정보 생성"""
    print(f"\n{'='*60}")
    print("📊 데이터 요약")
    print(f"{'='*60}")
    
    print(f"\n총 데이터 행 수: {len(all_data):,}행")
    print(f"\n기간: {all_data['년월'].min()} ~ {all_data['년월'].max()}")
    
    print(f"\n법인 목록 ({len(all_data['법인'].unique())}개):")
    for corp in sorted(all_data['법인'].unique()):
        count = len(all_data[all_data['법인'] == corp])
        print(f"  - {corp}: {count:,}행")
    
    print(f"\n본부 목록 ({len(all_data['본부'].unique())}개):")
    for dept in sorted(all_data['본부'].unique())[:10]:  # 상위 10개만
        count = len(all_data[all_data['본부'] == dept])
        print(f"  - {dept}: {count:,}행")
    if len(all_data['본부'].unique()) > 10:
        print(f"  ... 외 {len(all_data['본부'].unique()) - 10}개")
    
    print(f"\n계정과목 목록 ({len(all_data['계정과목'].unique())}개):")
    top_accounts = all_data.groupby('계정과목')['금액'].sum().sort_values(ascending=False).head(10)
    for account, amount in top_accounts.items():
        print(f"  - {account}: ₩{amount:,.0f}")
    
    print(f"\n총 비용: ₩{all_data['금액'].sum():,.0f}")
    print(f"평균 월별 비용: ₩{all_data.groupby('년월')['금액'].sum().mean():,.0f}")

def main():
    """메인 실행 함수"""
    print("="*60)
    print("🚀 엑셀 비용 데이터 정제 시작")
    print("="*60)
    
    all_data_list = []
    total_months = 0
    
    # 2024년 데이터 처리
    file_2024_path = os.path.join(INPUT_DIR, FILE_2024)
    if os.path.exists(file_2024_path):
        data_2024, months_2024 = process_excel_file(file_2024_path, '2024년', 2024)
        all_data_list.append(data_2024)
        total_months += months_2024
    else:
        print(f"⚠️  파일을 찾을 수 없습니다: {file_2024_path}")
    
    # 2025년 데이터 처리
    file_2025_path = os.path.join(INPUT_DIR, FILE_2025)
    if os.path.exists(file_2025_path):
        data_2025, months_2025 = process_excel_file(file_2025_path, '2025년', 2025)
        all_data_list.append(data_2025)
        total_months += months_2025
    else:
        print(f"⚠️  파일을 찾을 수 없습니다: {file_2025_path}")
    
    # 전체 데이터 통합
    if all_data_list:
        all_data = pd.concat(all_data_list, ignore_index=True)
        
        # 통합 파일 저장
        output_all = os.path.join(OUTPUT_DIR, "cost_all.csv")
        all_data.to_csv(output_all, index=False, encoding='utf-8-sig')
        print(f"\n✓ 통합 파일 저장 완료: {output_all}")
        
        # 요약 정보 출력
        generate_summary(all_data)
        
        print(f"\n{'='*60}")
        print(f"✅ 정제 완료!")
        print(f"{'='*60}")
        print(f"총 {total_months}개월 데이터 처리 완료")
        print(f"출력 디렉토리: {OUTPUT_DIR}")
        print(f"\n생성된 파일:")
        print(f"  - 월별 파일: cost_YYYYMM.csv ({total_months}개)")
        print(f"  - 통합 파일: cost_all.csv")
        
    else:
        print("\n❌ 처리할 데이터가 없습니다.")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()

