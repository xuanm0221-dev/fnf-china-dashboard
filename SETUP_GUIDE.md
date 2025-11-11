# 🚀 브랜드 비용 대시보드 설정 가이드

## 📋 프로젝트 개요
MLB, MLB Kids, Discovery, 공통 브랜드별 비용을 분석하는 인터랙티브 대시보드입니다.

## 🛠️ 기술 스택
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Data Processing**: PapaParse (CSV 파싱)
- **Icons**: Lucide React

## 📦 설치 및 실행

### 1. 패키지 설치 (이미 완료됨)
```bash
npm install
```

### 2. 엑셀 데이터를 CSV로 변환

현재 폴더에 있는 엑셀 파일들을 CSV로 변환해야 합니다:
- `2024.1-12.XLSX` (2024년 1-12월 데이터)
- `2025.1-10.XLSX` (2025년 1-10월 데이터)

**변환 방법:**

#### Option A: Python 스크립트 사용 (권장)
```bash
# 필요한 패키지 설치 (처음 한 번만)
pip install pandas openpyxl

# 변환 스크립트 실행
python excel_to_csv_converter.py
```

#### Option B: 수동 변환
엑셀 파일을 열어서 다음 형식으로 CSV 저장:
- 파일명: `sample_{브랜드id}_{YYYYMM}.csv`
- 브랜드 ID:
  - `mlb` - MLB
  - `mlb-kids` - MLB Kids
  - `discovery` - Discovery
  - `common` - 공통

**예시:**
- `sample_mlb_202401.csv`
- `sample_mlb-kids_202401.csv`
- `sample_discovery_202401.csv`
- `sample_common_202401.csv`

**CSV 형식:**
```csv
브랜드,본부,팀,계정과목,금액,비고
MLB,영업본부,영업1팀,급여,15000000,
MLB,영업본부,영업1팀,복리후생비,2000000,
```

### 3. 개발 서버 실행

**PowerShell에서 실행 정책 문제가 있는 경우:**
```bash
cmd /c npm run dev
```

**또는 일반적으로:**
```bash
npm run dev
```

서버가 시작되면 브라우저에서 다음 주소로 접속:
```
http://localhost:3000
```

## 🎨 대시보드 기능

### 메인 페이지
- 4개 브랜드 선택 카드
- 각 브랜드별 색상 테마
- 반응형 디자인 (모바일/태블릿/데스크톱)

### 브랜드별 대시보드
1. **필터링 기능**
   - 월 선택 (전체 또는 특정 월)
   - 본부 선택
   - 팀 선택

2. **통계 카드**
   - 총 비용
   - 평균 월 비용
   - 최고 비용 월
   - 비용 증감률

3. **시각화 차트**
   - 📈 월별 비용 추이 (Line Chart)
   - 📊 본부별 비용 비교 (Bar Chart)
   - 🥧 계정과목별 비용 분포 (Pie Chart)
   - 📊 팀별 비용 순위 Top 10 (Horizontal Bar Chart)

## 📱 반응형 디자인

### 모바일 (< 640px)
- 단일 컬럼 레이아웃
- 터치 최적화된 버튼 크기
- 간소화된 네비게이션

### 태블릿 (640px - 1024px)
- 2컬럼 그리드
- 중간 크기 차트

### 데스크톱 (> 1024px)
- 4컬럼 통계 카드
- 2x2 그리드 차트 레이아웃
- 전체 기능 표시

## 🚀 배포 준비

### 1. GitHub 연결
```bash
git init
git add .
git commit -m "Initial commit: Brand cost dashboard"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Vercel 배포

#### 방법 A: Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
```

#### 방법 B: Vercel 웹사이트
1. https://vercel.com 접속
2. "New Project" 클릭
3. GitHub 저장소 연결
4. 프로젝트 선택
5. "Deploy" 클릭

**중요:** CSV 파일들이 `public/data/` 폴더에 있는지 확인하세요!

## 📂 프로젝트 구조

```
hmcursor/
├── app/
│   ├── dashboard/
│   │   └── [brandId]/
│   │       └── page.tsx          # 동적 브랜드 페이지
│   ├── globals.css               # 전역 스타일
│   ├── layout.tsx                # 루트 레이아웃
│   └── page.tsx                  # 메인 페이지 (브랜드 선택)
├── components/
│   └── BrandDashboard.tsx        # 대시보드 컴포넌트
├── public/
│   └── data/
│       ├── sample_mlb_202401.csv
│       ├── sample_mlb_202402.csv
│       └── ... (기타 CSV 파일)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── excel_to_csv_converter.py     # 엑셀 변환 스크립트
└── README.md
```

## 🔧 데이터 업데이트 방법

### 새로운 월 데이터 추가
1. 엑셀 파일 업데이트
2. Python 스크립트 실행: `python excel_to_csv_converter.py`
3. 생성된 CSV 파일 확인
4. 개발 서버 재시작 (자동 새로고침)

### CSV 파일 직접 추가
1. `public/data/` 폴더에 CSV 파일 추가
2. 파일명 형식: `sample_{브랜드id}_{YYYYMM}.csv`
3. 페이지 새로고침

## 🎨 커스터마이징

### 브랜드 색상 변경
`app/page.tsx` 파일에서 브랜드 설정 수정:
```typescript
const brands = [
  {
    id: 'mlb',
    name: 'MLB',
    color: 'from-blue-600 to-blue-800',  // 여기 수정
    // ...
  },
];
```

### 차트 색상 변경
`components/BrandDashboard.tsx` 파일에서 COLORS 배열 수정:
```typescript
const COLORS = [
  '#8b5cf6',  // 보라
  '#ec4899',  // 핑크
  // ... 원하는 색상 추가
];
```

## 🐛 문제 해결

### 개발 서버가 시작되지 않는 경우
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules
npm install
```

### CSV 파일이 로드되지 않는 경우
1. 파일 경로 확인: `public/data/sample_{브랜드id}_{YYYYMM}.csv`
2. 파일명 형식 확인
3. CSV 인코딩 확인 (UTF-8 권장)
4. 브라우저 콘솔에서 에러 확인 (F12)

### 그래프가 표시되지 않는 경우
1. CSV 데이터 형식 확인
2. 금액 컬럼이 숫자인지 확인
3. 필수 컬럼 확인: 브랜드, 본부, 팀, 계정과목, 금액

### PowerShell 실행 정책 오류
```bash
# cmd 사용
cmd /c npm run dev

# 또는 실행 정책 변경 (관리자 권한)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📊 데이터 요구사항

### 필수 컬럼
- `브랜드`: 브랜드명 (MLB, MLB Kids, Discovery, 공통)
- `본부`: 본부명
- `팀`: 팀명
- `계정과목`: 비용 항목
- `금액`: 숫자 (쉼표 없이)
- `비고`: 선택사항

### 데이터 예시
```csv
브랜드,본부,팀,계정과목,금액,비고
MLB,영업본부,영업1팀,급여,15000000,
MLB,영업본부,영업1팀,복리후생비,2000000,
MLB,관리본부,총무팀,임차료,5000000,
```

## 🌐 브라우저 지원
- Chrome (권장)
- Firefox
- Safari
- Edge

## 📞 추가 지원

문제가 발생하거나 기능 추가가 필요한 경우:
1. 이 가이드 문서 참조
2. 브라우저 개발자 도구 (F12)에서 에러 확인
3. GitHub Issues 생성

## 🎯 다음 단계

1. ✅ 엑셀 데이터를 CSV로 변환
2. ✅ 개발 서버 실행 및 테스트
3. ⬜ 실제 데이터로 대시보드 확인
4. ⬜ GitHub에 푸시
5. ⬜ Vercel에 배포

---

**현재 상태:**
- ✅ Next.js 프로젝트 설정 완료
- ✅ 브랜드 선택 페이지 구현
- ✅ 대시보드 컴포넌트 구현
- ✅ 반응형 디자인 적용
- ✅ 샘플 데이터 생성
- ⏳ 실제 엑셀 데이터 변환 필요

**개발 서버 주소:** http://localhost:3000

