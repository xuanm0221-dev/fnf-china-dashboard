/**
 * MLB 중국본사 영업비 데이터 추출
 * 필터: 영업비구분="중국본사", 사업부="MLB"
 */

const XLSX = require('xlsx');
const fs = require('fs');

console.log('='.repeat(80));
console.log('MLB 중국본사 영업비 데이터 추출 시작');
console.log('='.repeat(80));

try {
  // 2024년 데이터
  console.log('\n📂 2024년 데이터 읽는 중...');
  const wb2024 = XLSX.readFile('2024.1-12.XLSX');
  const ws2024 = wb2024.Sheets['2024년'];
  const data2024 = XLSX.utils.sheet_to_json(ws2024);
  console.log(`   총 ${data2024.length}개 행`);

  // 2025년 데이터
  console.log('\n📂 2025년 데이터 읽는 중...');
  const wb2025 = XLSX.readFile('2025.1-10.XLSX');
  const ws2025 = wb2025.Sheets['2025년'];
  const data2025 = XLSX.utils.sheet_to_json(ws2025);
  console.log(`   총 ${data2025.length}개 행`);

  const mlbData = [];

  // 2024년 필터링 및 처리
  console.log('\n🔍 2024년 데이터 필터링 중...');
  let count2024 = 0;
  data2024.forEach(row => {
    // 필터: 영업비구분="중국본사" AND 사업부="MLB"
    if (row['영업비구분'] === '중국본사' && row['사업부'] === 'MLB') {
      for (let month = 1; month <= 12; month++) {
        const monthCol = `2024${String(month).padStart(2, '0')}`;
        const amount = parseFloat(String(row[monthCol] || 0).replace(/,/g, '')) || 0;
        
        if (amount !== 0) {
          mlbData.push({
            연월: `2024-${String(month).padStart(2, '0')}`,
            년도: 2024,
            월: month,
            본부: String(row['Cost ctr desc'] || ''),
            부서명: String(row['부서명'] || ''),
            대분류: String(row['대분류'] || ''),
            중분류: String(row['중분류'] || ''),
            계정과목: String(row['Cost Elem desc'] || ''),
            금액: amount,
          });
          count2024++;
        }
      }
    }
  });
  console.log(`   ✅ ${count2024}개 데이터 추출`);

  // 2025년 필터링 및 처리
  console.log('\n🔍 2025년 데이터 필터링 중...');
  let count2025 = 0;
  data2025.forEach(row => {
    if (row['영업비구분'] === '중국본사' && row['사업부'] === 'MLB') {
      for (let month = 1; month <= 10; month++) {
        const monthCol = `2025${String(month).padStart(2, '0')}`;
        const amount = parseFloat(String(row[monthCol] || 0).replace(/,/g, '')) || 0;
        
        if (amount !== 0) {
          mlbData.push({
            연월: `2025-${String(month).padStart(2, '0')}`,
            년도: 2025,
            월: month,
            본부: String(row['Cost ctr desc'] || ''),
            부서명: String(row['부서명'] || ''),
            대분류: String(row['대분류'] || ''),
            중분류: String(row['중분류'] || ''),
            계정과목: String(row['Cost Elem desc'] || ''),
            금액: amount,
          });
          count2025++;
        }
      }
    }
  });
  console.log(`   ✅ ${count2025}개 데이터 추출`);

  // JSON 저장
  const outputFile = 'public/data/mlb_china_data.json';
  fs.writeFileSync(outputFile, JSON.stringify(mlbData, null, 2), 'utf-8');

  console.log(`\n${'='.repeat(80)}`);
  console.log(`✅ 완료!`);
  console.log(`📁 파일: ${outputFile}`);
  console.log(`📊 총 데이터: ${mlbData.length.toLocaleString()}개`);
  console.log('='.repeat(80));

  // 대분류별 통계
  console.log('\n📊 대분류별 데이터 수:');
  const categoryStats = {};
  mlbData.forEach(d => {
    categoryStats[d.대분류] = (categoryStats[d.대분류] || 0) + 1;
  });
  Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count.toLocaleString()}개`);
    });

} catch (error) {
  console.error('\n❌ 오류:', error.message);
  console.error(error.stack);
}

