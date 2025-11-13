# 비용 대시보드 프로젝트

## 📋 프로젝트 개요
Next.js 기반의 인터랙티브 비용 분석 대시보드입니다. 
월별 비용 데이터를 시각화하고, 다양한 필터링 및 분석 기능을 제공합니다.

## 🛠️ 기술 스택
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Data Processing**: PapaParse (CSV 파싱)
- **Icons**: Lucide React

## 📦 설치 방법

### 1. 필수 프로그램 설치
- Node.js 18.0 이상
- npm 또는 yarn

### 2. 프로젝트 설정
```bash
# 1. 새 Next.js 프로젝트 생성
npx create-next-app@latest my-dashboard --typescript --tailwind --app

# 2. 프로젝트 디렉토리로 이동
cd my-dashboard

# 3. 필요한 패키지 설치
npm install recharts papaparse lucide-react
npm install --save-dev @types/papaparse
```

### 3. 프로젝트 구조 생성
```
my-dashboard/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── CostDashboard.tsx
├── public/
│   └── data/
│       ├── cost_202401.csv
│       ├── cost_202402.csv
│       └── ... (기타 월별 CSV 파일)
└── package.json
```

## 📊 데이터 구조

### CSV 파일 형식
각 월별 CSV 파일은 다음 컬럼을 포함해야 합니다:

```csv
법인,본부,팀,계정과목,금액,비고
A법인,영업본부,영업1팀,급여,5000000,
A법인,영업본부,영업1팀,복리후생비,500000,
B법인,관리본부,총무팀,임차료,2000000,
```

**필수 컬럼:**
- `법인`: 법인명 (예: A법인, B법인)
- `본부`: 본부명 (예: 영업본부, 관리본부)
- `팀`: 팀명 (예: 영업1팀, 총무팀)
- `계정과목`: 비용 항목 (예: 급여, 복리후생비, 임차료)
- `금액`: 숫자 (쉼표 없이 입력)
- `비고`: 선택사항

### 파일명 규칙
- 형식: `cost_YYYYMM.csv`
- 예시: `cost_202401.csv`, `cost_202402.csv`

## 🎨 대시보드 기능

### 1. 필터링 기능
- **법인 필터**: 특정 법인 선택 또는 전체 보기
- **본부 필터**: 특정 본부 선택 또는 전체 보기
- **팀 필터**: 특정 팀 선택 또는 전체 보기
- **월 선택**: 단일 월 또는 기간 선택

### 2. 그래프 종류

#### 📈 월별 비용 추이 (Line Chart)
```typescript
// 속성
- dataKey: "총비용"
- stroke: "#8b5cf6" (보라색)
- strokeWidth: 2
- dot: { fill: '#8b5cf6', r: 4 }
```

#### 📊 본부별 비용 비교 (Bar Chart)
```typescript
// 속성
- dataKey: "비용"
- fill: "#8b5cf6" (보라색)
- radius: [8, 8, 0, 0] (상단 모서리 둥글게)
```

#### 🥧 계정과목별 비용 분포 (Pie Chart)
```typescript
// 색상 팔레트
const COLORS = [
  '#8b5cf6', // 보라
  '#ec4899', // 핑크
  '#f59e0b', // 주황
  '#10b981', // 초록
  '#3b82f6', // 파랑
  '#f97316', // 주황-빨강
  '#06b6d4', // 청록
  '#84cc16'  // 연두
];

// 속성
- innerRadius: 60
- outerRadius: 100
- paddingAngle: 2
```

#### 📊 팀별 비용 순위 (Horizontal Bar Chart)
```typescript
// 속성
- layout: "vertical"
- dataKey: "비용"
- fill: "#8b5cf6"
- radius: [0, 8, 8, 0] (우측 모서리 둥글게)
```

### 3. 통계 카드
```typescript
// 4개의 주요 지표
1. 총 비용: 선택된 기간의 전체 비용 합계
2. 평균 월 비용: 월평균 비용
3. 최고 비용 월: 가장 비용이 높았던 월
4. 비용 증감률: 전월 대비 증감 비율
```

## 🎨 스타일링 가이드

### 색상 테마
```css
/* 주요 색상 */
--primary: #8b5cf6;        /* 보라색 - 메인 */
--primary-dark: #7c3aed;   /* 진한 보라 - 호버 */
--background: #0f172a;     /* 다크 배경 */
--card-bg: #1e293b;        /* 카드 배경 */
--border: #334155;         /* 테두리 */
--text-primary: #f1f5f9;   /* 주요 텍스트 */
--text-secondary: #94a3b8; /* 보조 텍스트 */
```

### 카드 스타일
```typescript
className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700"
```

### 버튼 스타일
```typescript
// 활성 상태
className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"

// 비활성 상태
className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
```

## 🔧 커스터마이징 방법

### 1. 법인명 변경
```typescript
// CostDashboard.tsx 파일에서
// 데이터 로드 시 자동으로 법인명을 추출하므로 CSV 파일만 수정하면 됩니다
```

### 2. 계정과목 추가/변경
```typescript
// CSV 파일의 '계정과목' 컬럼에 새로운 항목 추가
// 자동으로 그래프에 반영됩니다
```

### 3. 색상 변경
```typescript
// CostDashboard.tsx에서 COLORS 배열 수정
const COLORS = [
  '#your-color-1',
  '#your-color-2',
  // ... 원하는 색상 추가
];
```

### 4. 그래프 크기 조정
```typescript
// 각 그래프의 ResponsiveContainer height 속성 수정
<ResponsiveContainer width="100%" height={400}>
  {/* 400을 원하는 높이로 변경 */}
</ResponsiveContainer>
```

## 🚀 실행 방법

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 🚢 배포 가이드

### GitHub에 푸시하기

1. **GitHub 저장소 생성**
   - GitHub에서 새 저장소를 생성합니다
   - 저장소 이름을 입력하고 생성합니다

2. **로컬 저장소 준비**
   ```bash
   # 변경사항 추가
   git add .

   # 커밋
   git commit -m "Initial commit: Brand Cost Dashboard"

   # 원격 저장소 추가 (your-username과 your-repo-name을 실제 값으로 변경)
   git remote add origin https://github.com/your-username/your-repo-name.git

   # 메인 브랜치로 푸시
   git branch -M main
   git push -u origin main
   ```

3. **필요한 파일만 커밋 확인**
   - `.gitignore` 파일이 올바르게 설정되어 있는지 확인
   - `node_modules`, `.next`, `.env.local` 등은 자동으로 제외됩니다

### Vercel에 배포하기

Vercel은 Next.js 프로젝트를 완벽하게 지원하며, GitHub과 연동하여 자동 배포가 가능합니다.

#### 방법 1: Vercel 웹사이트를 통한 배포 (권장)

1. **Vercel 계정 생성**
   - [https://vercel.com](https://vercel.com)에 접속
   - GitHub 계정으로 로그인

2. **프로젝트 Import**
   - 대시보드에서 "New Project" 클릭
   - GitHub 저장소 선택
   - 프로젝트 설정:
     - **Framework Preset**: Next.js (자동 감지됨)
     - **Root Directory**: `./` (기본값)
     - **Build Command**: `npm run build` (기본값)
     - **Output Directory**: `.next` (기본값)
     - **Install Command**: `npm install` (기본값)

3. **환경 변수 설정** (필요한 경우)
   - 프로젝트 설정에서 Environment Variables 추가
   - 현재 프로젝트는 환경 변수가 필요 없을 수 있습니다

4. **Deploy**
   - "Deploy" 버튼 클릭
   - 배포가 완료되면 자동으로 URL이 생성됩니다
   - 예: `https://your-project-name.vercel.app`

#### 방법 2: Vercel CLI를 통한 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 디렉토리에서 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 자동 배포 설정

GitHub과 Vercel을 연동하면:
- ✅ **자동 배포**: `main` 브랜치에 푸시할 때마다 자동으로 배포됩니다
- ✅ **프리뷰 배포**: Pull Request 생성 시 프리뷰 URL이 생성됩니다
- ✅ **빠른 롤백**: 이전 배포 버전으로 쉽게 롤백할 수 있습니다

### 배포 후 확인사항

1. **빌드 성공 확인**
   - Vercel 대시보드에서 빌드 로그 확인
   - 에러가 있다면 로그에서 확인 가능

2. **환경 변수 확인** (필요한 경우)
   - 프로덕션 환경에서도 환경 변수가 설정되어 있는지 확인

3. **데이터 파일 확인**
   - `public/data/` 폴더의 CSV 파일들이 제대로 포함되었는지 확인
   - 파일 크기가 너무 크면 Vercel의 제한을 확인해야 합니다

### Vercel 배포 최적화

1. **빌드 최적화**
   - `next.config.js`에서 이미지 최적화 설정
   - 정적 파일 캐싱 설정

2. **성능 모니터링**
   - Vercel Analytics 활성화
   - Web Vitals 모니터링

3. **도메인 연결** (선택사항)
   - Vercel에서 커스텀 도메인 연결 가능
   - SSL 인증서 자동 적용

### 문제 해결

#### 빌드 실패 시
- Vercel 대시보드의 빌드 로그 확인
- 로컬에서 `npm run build` 테스트
- 의존성 문제 확인

#### 데이터 파일이 로드되지 않을 때
- `public/data/` 폴더에 파일이 포함되어 있는지 확인
- 파일 경로가 올바른지 확인
- 파일 크기 제한 확인 (Vercel은 파일 크기 제한이 있습니다)

#### 환경 변수 문제
- Vercel 프로젝트 설정에서 환경 변수 확인
- 로컬과 프로덕션 환경 변수 일치 확인

## 📝 데이터 준비 체크리스트

- [ ] CSV 파일 준비 (cost_YYYYMM.csv 형식)
- [ ] 필수 컬럼 확인 (법인, 본부, 팀, 계정과목, 금액, 비고)
- [ ] 금액 데이터 숫자 형식 확인 (쉼표 제거)
- [ ] 파일을 `public/data/` 폴더에 배치
- [ ] 최소 1개월 이상의 데이터 준비

## 🐛 문제 해결

### CSV 파일이 로드되지 않을 때
1. 파일 경로 확인: `public/data/cost_YYYYMM.csv`
2. 파일명 형식 확인
3. 인코딩 확인 (UTF-8 권장)

### 그래프가 표시되지 않을 때
1. 데이터 형식 확인 (금액이 숫자인지)
2. 브라우저 콘솔에서 에러 확인
3. 필수 컬럼이 모두 있는지 확인

### 한글이 깨질 때
1. CSV 파일을 UTF-8 인코딩으로 저장
2. Excel에서 저장 시 "CSV UTF-8" 형식 선택

## 📞 추가 커스터마이징이 필요하면

새로운 Cursor 세션에서 이 README와 함께 다음 정보를 전달하세요:

```
1. 이 README 파일
2. 변경하고 싶은 법인명/본부명/팀명
3. 추가하고 싶은 기능
4. 변경하고 싶은 색상이나 디자인
5. 샘플 CSV 파일 (2-3개월분)
```

## 📄 라이선스
MIT License

## 🎯 주요 특징 요약
- ✅ 반응형 디자인 (모바일/태블릿/데스크톱)
- ✅ 다크 모드 UI
- ✅ 실시간 필터링
- ✅ 인터랙티브 차트
- ✅ CSV 기반 데이터 관리
- ✅ TypeScript 타입 안정성
- ✅ 쉬운 커스터마이징

---

## 📂 현재 프로젝트 구조

```
251104/
├── app/
│   ├── layout.tsx          # 전역 레이아웃
│   ├── page.tsx            # 메인 페이지
│   └── globals.css         # 전역 스타일
├── components/
│   └── CostDashboard.tsx   # 대시보드 메인 컴포넌트
├── public/
│   └── data/
│       ├── cost_202401.csv
│       ├── cost_202402.csv
│       ├── cost_202403.csv
│       ├── cost_202404.csv
│       ├── cost_202405.csv
│       ├── cost_202406.csv
│       ├── cost_202407.csv
│       ├── cost_202408.csv
│       ├── cost_202409.csv
│       └── cost_202410.csv
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md              # 이 파일
```

## 💡 빠른 시작 가이드

1. **이 프로젝트를 복제했다면:**
```bash
npm install
npm run dev
```

2. **새로 시작한다면:**
- 위의 "설치 방법" 섹션을 따라하세요
- 이 README의 모든 코드와 설정을 참고하세요
- CSV 데이터 형식을 맞춰서 준비하세요
