/**
 * Node.js로 엑셀 파일을 JSON으로 변환
 * 실행: node convert_excel.js
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('='

.repeat(80));
console.log('엑셀 데이터 변환 시작');
console.log('='.repeat(80));

// 브랜드 매핑
const brandMap = {
  'MLB': 'mlb',
  'MLB Kids': 'mlb-kids',
  'Discovery': 'discovery',
  '공통': 'common'
};

const allData = {
  'mlb': [],
  'mlb-kids': [],
  'discovery': [],
  'common': []
};

try {
  // 2024년 데이터 읽기
  console.log('\n📂 2024년 데이터 읽는 중...');
  const workbook2024 = XLSX.readFile('2024.1-12.XLSX');
  const sheet2024 = workbook2024.Sheets['2024년'];
  const data2024 = XLSX.utils.sheet_to_json(sheet2024);
  console.log(`   ${data2024.length}개 행 로드됨`);

  // 2025년 데이터 읽기
  console.log('\n📂 2025년 데이터 읽는 중...');
  const workbook2025 = XLSX.readFile('2025.1-10.XLSX');
  const sheet2025 = workbook2025.Sheets['2025년'];
  const data2025 = XLSX.utils.sheet_to_json(sheet2025);
  console.log(`   ${data2025.length}개 행 로드됨`);

  // 2024년 데이터 처리
  console.log('\n🔄 2024년 데이터 처리 중...');
  for (const brand in brandMap) {
    const brandId = brandMap[brand];
    let count = 0;

    data2024.forEach(row => {
      if (row['사업부'] === brand) {
        for (let month = 1; month <= 12; month++) {
          const monthCol = `2024${String(month).padStart(2, '0')}`;
          const amount = parseFloat(String(row[monthCol] || 0).replace(/,/g, '')) || 0;

          if (amount !== 0) {
            allData[brandId].push({
              브랜드: brand,
              본부: String(row['Cost ctr desc'] || ''),
              팀: String(row['부서명'] || ''),
              계정과목: String(row['대분류'] || ''),
              금액: amount,
              연월: `2024-${String(month).padStart(2, '0')}`
            });
            count++;
          }
        }
      }
    });

    console.log(`   ${brand}: ${count}개 데이터`);
  }

  // 2025년 데이터 처리
  console.log('\n🔄 2025년 데이터 처리 중...');
  for (const brand in brandMap) {
    const brandId = brandMap[brand];
    let count = 0;

    data2025.forEach(row => {
      if (row['사업부'] === brand) {
        for (let month = 1; month <= 10; month++) {
          const monthCol = `2025${String(month).padStart(2, '0')}`;
          const amount = parseFloat(String(row[monthCol] || 0).replace(/,/g, '')) || 0;

          if (amount !== 0) {
            allData[brandId].push({
              브랜드: brand,
              본부: String(row['Cost ctr desc'] || ''),
              팀: String(row['부서명'] || ''),
              계정과목: String(row['대분류'] || ''),
              금액: amount,
              연월: `2025-${String(month).padStart(2, '0')}`
            });
            count++;
          }
        }
      }
    });

    console.log(`   ${brand}: ${count}개 데이터`);
  }

  // JSON 파일로 저장
  const outputDir = path.join('public', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, 'cost_data.json');
  fs.writeFileSync(outputFile, JSON.stringify(allData, null, 2), 'utf-8');

  console.log('\n' + '='.repeat(80));
  console.log(`✅ 변환 완료! ${outputFile} 저장됨`);
  console.log('='.repeat(80));

  console.log('\n📊 브랜드별 데이터 통계:');
  for (const brandId in allData) {
    console.log(`   ${brandId}: ${allData[brandId].length.toLocaleString()}개`);
  }

} catch (error) {
  console.error('\n❌ 오류 발생:', error.message);
  console.error(error.stack);
}

