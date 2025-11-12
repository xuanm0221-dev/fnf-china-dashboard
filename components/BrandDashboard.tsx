'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, DollarSign, Edit, ChevronRight, ChevronDown, Users } from 'lucide-react';
import Link from 'next/link';

interface CostData {
  브랜드: string;
  본부: string;
  팀: string;
  대분류: string;
  중분류: string;
  소분류: string;
  계정과목: string;
  금액: number;
  년월: string;
  비고: string;
}

// 트렌디한 파스텔 컬러 팔레트 (2024-2025 유행)
const COLORS = [
  '#F0A3FF', // 소프트 라벤더
  '#A8E6CF', // 민트 그린
  '#B5E5CF', // 세이지 그린
  '#FFD3B6', // 피치
  '#FFAAA5', // 코랄 핑크
  '#C7CEEA', // 베이비 블루
  '#FFEAA7', // 버터 옐로우
  '#DDA0DD', // 플럼
];

// 통계 카드 그라데이션 색상 (트렌디한 파스텔)
const STAT_GRADIENTS = {
  pink: 'from-[#FFD3B6] to-[#FFAAA5]',
  blue: 'from-[#C7CEEA] to-[#B5E5CF]',
  yellow: 'from-[#FFEAA7] to-[#FFD3B6]',
  green: 'from-[#A8E6CF] to-[#B5E5CF]',
  purple: 'from-[#F0A3FF] to-[#DDA0DD]',
};

const BRAND_NAMES: { [key: string]: string } = {
  'mlb': 'MLB',
  'mlb-kids': 'KIDS',
  'discovery': 'DX',
  'common': '공통',
};

export default function BrandDashboard({ 
  brandId, 
  initialMonth 
}: { 
  brandId: string;
  initialMonth?: string;
}) {
  const [allData, setAllData] = useState<CostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth || 'all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all'); // 대분류 필터
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [employeeCount, setEmployeeCount] = useState<number>(0);
  const [revenue, setRevenue] = useState<number>(0);
  
  // 드릴다운 테이블용 state
  const [expandedRows, setExpandedRows] = useState<{[key: string]: boolean}>({});
  const [allExpanded, setAllExpanded] = useState(false);
  
  // 대분류 상세 뷰 state
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<string | null>(null); // null이면 대분류 전체, string이면 해당 대분류의 소분류

  const brandName = BRAND_NAMES[brandId] || brandId;

  // initialMonth가 변경되면 selectedMonth 업데이트
  useEffect(() => {
    if (initialMonth) {
      setSelectedMonth(initialMonth);
    }
  }, [initialMonth]);

  // selectedMonth 변경 시 URL 업데이트
  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    // URL 업데이트
    const url = new URL(window.location.href);
    if (newMonth !== 'all') {
      url.searchParams.set('month', newMonth);
    } else {
      url.searchParams.delete('month');
    }
    window.history.pushState({}, '', url.toString());
  };

  useEffect(() => {
    loadData();
    loadEmployeeData();
    loadRevenueData();
  }, [brandId, selectedMonth]);

  const loadEmployeeData = async () => {
    try {
      const year = selectedMonth && selectedMonth !== 'all' ? selectedMonth.substring(0, 4) : '2025';
      const month = selectedMonth && selectedMonth !== 'all' ? parseInt(selectedMonth.substring(4)) : 10;
      
      const response = await fetch(`/data/인원수_${year}.csv`);
      if (!response.ok) return;
      
      const csvText = await response.text();
      const rows = csvText.split('\n');
      
      // 브랜드명 매핑
      const brandColumnMap: { [key: string]: string } = {
        'mlb': 'MLB',
        'mlb-kids': 'KIDS',
        'discovery': 'DX',
        'common': '공통'
      };
      
      const columnName = brandColumnMap[brandId];
      if (!columnName) return;
      
      // 헤더에서 컬럼 인덱스 찾기
      const headers = rows[0].split(',');
      const columnIndex = headers.findIndex(h => h.trim() === columnName);
      if (columnIndex === -1) return;
      
      // 해당 월의 행 찾기 (예: "25년10월")
      const monthStr = `${year.substring(2)}년${month}월`;
      const targetRow = rows.find(r => r.startsWith(monthStr));
      
      if (targetRow) {
        const cols = targetRow.split(',');
        const employeeStr = cols[columnIndex]?.trim().replace('명', '');
        const count = parseInt(employeeStr) || 0;
        setEmployeeCount(count);
      }
    } catch (error) {
      console.error('Error loading employee data:', error);
    }
  };

  const loadRevenueData = async () => {
    try {
      // 공통 브랜드는 실판매출이 없음
      if (brandId === 'common') {
        setRevenue(0);
        return;
      }
      
      const year = selectedMonth && selectedMonth !== 'all' ? selectedMonth.substring(0, 4) : '2025';
      const month = selectedMonth && selectedMonth !== 'all' ? parseInt(selectedMonth.substring(4)) : 10;
      
      const response = await fetch(`/data/실판매출_${year}.csv`);
      if (!response.ok) return;
      
      const csvText = await response.text();
      const rows = csvText.split('\n');
      
      // 브랜드명 매핑 (CSV의 컬럼명과 매칭)
      const brandColumnMap: { [key: string]: string } = {
        'mlb': 'MLB',
        'mlb-kids': 'KIDS',
        'discovery': 'DISCOVERY',
      };
      
      const columnName = brandColumnMap[brandId];
      if (!columnName) {
        setRevenue(0);
        return;
      }
      
      // 헤더 파싱 (큰따옴표 처리)
      const headerRow = rows[0];
      const headers: string[] = [];
      let inQuotes = false;
      let currentHeader = '';
      
      for (let i = 0; i < headerRow.length; i++) {
        const char = headerRow[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          headers.push(currentHeader.trim());
          currentHeader = '';
        } else {
          currentHeader += char;
        }
      }
      if (currentHeader) headers.push(currentHeader.trim());
      
      const columnIndex = headers.findIndex(h => h === columnName);
      if (columnIndex === -1) {
        setRevenue(0);
        return;
      }
      
      // 월 이름 매핑 (Jan, Feb, Mar...)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[month - 1];
      
      // 해당 월의 행 찾기
      const targetRow = rows.find(r => r.trim().startsWith(monthName));
      
      if (targetRow) {
        // CSV 파싱 (큰따옴표 안의 쉼표 처리)
        const cols: string[] = [];
        inQuotes = false;
        let currentCol = '';
        
        for (let i = 0; i < targetRow.length; i++) {
          const char = targetRow[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            cols.push(currentCol.trim());
            currentCol = '';
          } else {
            currentCol += char;
          }
        }
        if (currentCol) cols.push(currentCol.trim());
        
        // 해당 컬럼의 값 추출
        if (cols[columnIndex]) {
          let revenueStr = cols[columnIndex].replace(/["]/g, '').replace(/,/g, '').trim();
          const revenueValue = parseFloat(revenueStr) || 0;
          setRevenue(revenueValue);
        } else {
          setRevenue(0);
        }
      } else {
        setRevenue(0);
      }
    } catch (error) {
      console.error('Error loading revenue data:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    
    try {
      // 2024년과 2025년 데이터 로드
      const allCsvData: CostData[] = [];
      const months = [
        '202401', '202402', '202403', '202404', '202405', '202406',
        '202407', '202408', '202409', '202410', '202411', '202412',
        '202501', '202502', '202503', '202504', '202505', '202506',
        '202507', '202508', '202509', '202510' // 2025년 9월 포함
      ];
      
      // 브랜드 ID에 따른 파일명 접두사
      let filePrefix = brandId;
      if (brandId === 'mlb-kids') {
        filePrefix = 'kids'; // cost_kids_YYYYMM.csv
      }
      
      // 각 월의 CSV 파일 로드 (브랜드만)
      const filePrefixes = [filePrefix];
      
      for (const month of months) {
        for (const prefix of filePrefixes) {
          try {
            const response = await fetch(`/data/cost_${prefix}_${month}.csv`);
            if (response.ok) {
              const csvText = await response.text();
              const rows = csvText.split('\n').slice(1); // 헤더 제거
              
              for (const row of rows) {
                if (!row.trim()) continue;
                
                // CSV 파싱: 큰따옴표 안의 쉼표 처리
                const cols: string[] = [];
                let current = '';
                let inQuotes = false;
                
                for (let i = 0; i < row.length; i++) {
                  const char = row[i];
                  
                  if (char === '"') {
                    inQuotes = !inQuotes;
                  } else if (char === ',' && !inQuotes) {
                    cols.push(current.trim());
                    current = '';
                  } else {
                    current += char;
                  }
                }
                cols.push(current.trim()); // 마지막 컬럼 추가
                
                if (cols.length >= 9) {
                  // 금액 파싱 (쉼표와 따옴표 제거)
                  const amount = parseFloat(cols[7].replace(/[,"]/g, '')) || 0;
                
                if (amount !== 0) {
                  allCsvData.push({
                    브랜드: cols[0],
                    본부: cols[1],
                    팀: cols[2],
                    대분류: cols[3],
                    중분류: cols[4].replace(/"/g, ''), // 큰따옴표 제거
                    소분류: cols[5],
                    계정과목: cols[6],
                    금액: amount,
                    년월: cols[8],
                    비고: cols[9] || ''
                  });
                }
              }
            }
          }
          } catch (error) {
            // 파일이 없으면 건너뛰기
            continue;
          }
        }
      }
      
      setAllData(allCsvData);
      
      // 사용 가능한 월 추출
      const uniqueMonths = Array.from(
        new Set(allCsvData.map((d) => d.년월))
      ).sort() as string[];
      setAvailableMonths(uniqueMonths);
      
      console.log(`✅ ${brandName} 데이터 로드 완료: ${allCsvData.length}개 행`);
      
    } catch (error) {
      console.error('Error loading data:', error);
    }
    
    setLoading(false);
  };

  // 브랜드별 데이터 필터링 (해당 브랜드만)
  const brandFilteredData = allData.filter((row) => {
    const brandName = BRAND_NAMES[brandId];
    return row.브랜드 === brandName;
  });

  // 필터링된 데이터 (통계용 - 월 필터만 적용)
  const filteredData = brandFilteredData.filter((row) => {
    if (selectedMonth !== 'all' && row.년월 !== selectedMonth) return false;
    return true;
  });

  // 통계 계산
  const totalCost = filteredData.reduce((sum, row) => sum + row.금액, 0);
  
  // 디버깅 로그
  console.log('========== MLB 비용 계산 디버깅 ==========');
  console.log('brandId:', brandId);
  console.log('BRAND_NAMES[brandId]:', BRAND_NAMES[brandId]);
  console.log('selectedMonth:', selectedMonth);
  console.log('allData 총 개수:', allData.length);
  console.log('brandFilteredData 개수:', brandFilteredData.length);
  console.log('filteredData 개수:', filteredData.length);
  console.log('filteredData 샘플 (처음 3개):', filteredData.slice(0, 3));
  console.log('totalCost:', totalCost);
  console.log('totalCost (K단위):', totalCost / 1000);
  console.log('각 행의 금액 합계 검증:', filteredData.reduce((sum, row) => {
    console.log(`  - ${row.대분류} / ${row.소분류}: ${row.금액}`);
    return sum + row.금액;
  }, 0));
  console.log('==========================================');
  
  const uniqueMonths = Array.from(new Set(filteredData.map((d) => d.년월)));

  // 월별 데이터 (대분류별 포함) - 브랜드 필터 적용
  const categories = Array.from(new Set(brandFilteredData.map((d) => d.대분류))).filter(c => c && c !== 'nan').sort();
  
  // 대분류별 트렌디한 파스텔 색상 매핑
  const categoryColors: { [key: string]: string } = {
    '인건비': '#FFAAA5', // 코랄 핑크
    '복리후생비': '#C7CEEA', // 베이비 블루
    '광고비': '#FFEAA7', // 버터 옐로우
    '출장비': '#A8E6CF', // 민트 그린
    '수주회': '#F0A3FF', // 소프트 라벤더
    '감가상각비': '#FFD3B6', // 피치
    '기타': '#DDA0DD', // 플럼
  };
  
  // initialMonth가 있으면 해당 월까지만 필터링
  const displayMonths = initialMonth && initialMonth !== 'all'
    ? availableMonths.filter(m => {
        // 2025년 데이터만 표시하고, initialMonth 이하만
        if (!m.startsWith('2025')) return false;
        return parseInt(m) <= parseInt(initialMonth);
      })
    : availableMonths;
  
  // 월별 비용 추이 그래프용 데이터 (본부 + 대분류 필터 적용)
  const monthlyData = displayMonths.map((month) => {
    let monthData = brandFilteredData.filter((d) => d.년월 === month);
    
    // 본부 필터 적용
    if (selectedDepartment !== 'all') {
      monthData = monthData.filter(d => d.본부 === selectedDepartment);
    }
    
    const result: any = {
      month: month.substring(4), // YYYYMM에서 MM만
      fullMonth: `${month.substring(0, 4)}-${month.substring(4)}`, // 툴팁용
    };
    
    // 전체 비용
    result['총비용'] = monthData.reduce((sum, row) => sum + row.금액, 0);
    
    // 대분류별 비용
    categories.forEach((category) => {
      const categoryCost = monthData
        .filter((d) => d.대분류 === category)
        .reduce((sum, row) => sum + row.금액, 0);
      if (categoryCost > 0) {
        result[category] = categoryCost;
      }
    });
    
    return result;
  });

  // 본부별 데이터
  const departmentData = Object.entries(
    filteredData.reduce((acc: any, row) => {
      acc[row.본부] = (acc[row.본부] || 0) + row.금액;
      return acc;
    }, {})
  ).map(([본부, 비용]) => ({ 본부, 비용: 비용 as number }))
   .sort((a, b) => b.비용 - a.비용)
   .slice(0, 10);

  // 계정과목별 데이터
  const accountData = Object.entries(
    filteredData.reduce((acc: any, row) => {
      acc[row.계정과목] = (acc[row.계정과목] || 0) + row.금액;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: value as number }))
   .sort((a, b) => b.value - a.value)
   .slice(0, 8);

  // 팀별 데이터 (상위 10개)
  const teamData = Object.entries(
    filteredData.reduce((acc: any, row) => {
      acc[row.팀] = (acc[row.팀] || 0) + row.금액;
      return acc;
    }, {})
  )
    .map(([팀, 비용]) => ({ 팀, 비용: 비용 as number }))
    .sort((a, b) => b.비용 - a.비용)
    .slice(0, 10);

  // 고유 값들 - 브랜드 필터 적용
  const departments = Array.from(new Set(brandFilteredData.map((d) => d.본부))).filter(d => d && d !== 'nan');
  const teams = Array.from(
    new Set(
      brandFilteredData
        .filter((d) => selectedDepartment === 'all' || d.본부 === selectedDepartment)
        .map((d) => d.팀)
    )
  ).filter(t => t && t !== 'nan');

  // 증감률 계산
  const lastTwoMonths = monthlyData.slice(-2);
  const changeRate =
    lastTwoMonths.length === 2 && lastTwoMonths[0].총비용 > 0
      ? ((lastTwoMonths[1].총비용 - lastTwoMonths[0].총비용) / lastTwoMonths[0].총비용) * 100
      : 0;

  // YOY (전년 동기 대비) 데이터 계산 - 2025년 각 월의 2024년 동월 대비 (본부 필터 적용)
  const yoyData = displayMonths
    .filter(month => month.startsWith('2025'))
    .map((month) => {
      const currentMonth = month.substring(4); // MM (01, 02, ...)
      const prevYearMonth = `2024${currentMonth}`; // 2024년 동월
      
      // 2025년 해당 월 데이터 - 브랜드 필터 적용
      let current2025Data = brandFilteredData.filter(d => d.년월 === month);
      if (selectedDepartment !== 'all') {
        current2025Data = current2025Data.filter(d => d.본부 === selectedDepartment);
      }
      const current2025Cost = current2025Data.reduce((sum, row) => sum + row.금액, 0);
      
      // 2024년 동월 데이터 - 브랜드 필터 적용
      let prev2024Data = brandFilteredData.filter(d => d.년월 === prevYearMonth);
      if (selectedDepartment !== 'all') {
        prev2024Data = prev2024Data.filter(d => d.본부 === selectedDepartment);
      }
      const prev2024Cost = prev2024Data.reduce((sum, row) => sum + row.금액, 0);
      
      // YOY 증감률 계산
      const yoyRate = prev2024Cost > 0 ? ((current2025Cost - prev2024Cost) / prev2024Cost) * 100 : 0;
      
      return {
        month: currentMonth, // MM
        fullMonth: month, // YYYYMM
        '2024년': prev2024Cost,
        '2025년': current2025Cost,
        'YOY (%)': parseFloat(yoyRate.toFixed(1)),
      };
    });

  const formatCurrency = (value: number) => {
    if (value === 0) return '0K';
    
    // K 단위 (천 단위)로 변환
    const valueInK = value / 1000;
    
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valueInK) + 'K';
  };

  // 전체 펼치기/접기 함수
  const toggleAllRows = () => {
    if (allExpanded) {
      // 전체 접기
      setExpandedRows({});
      setAllExpanded(false);
    } else {
      // 전체 펼치기
      const newExpandedRows: {[key: string]: boolean} = {};
      categories.forEach(cat => {
        newExpandedRows[cat] = true;
      });
      setExpandedRows(newExpandedRows);
      setAllExpanded(true);
    }
  };

  // 드릴다운 테이블 데이터 생성 (대분류 → 소분류)
  console.log('Available categories:', categories);
  
  // 현재 선택된 월까지의 월 목록 (누적용)
  const currentMonth = selectedMonth && selectedMonth !== 'all' ? parseInt(selectedMonth.substring(4)) : 10;
  const accumulatedMonths2025 = Array.from({length: currentMonth}, (_, i) => `2025${String(i + 1).padStart(2, '0')}`);
  const accumulatedMonths2024 = Array.from({length: currentMonth}, (_, i) => `2024${String(i + 1).padStart(2, '0')}`);
  
  const drilldownData = categories.map((대분류) => {
    // 당월 데이터 (2025, 2024)
    const data2025Monthly = selectedMonth !== 'all' 
      ? brandFilteredData.filter(d => d.대분류 === 대분류 && d.년월 === selectedMonth)
      : brandFilteredData.filter(d => d.대분류 === 대분류 && d.년월 === '202510'); // 기본값
    const cost2025Monthly = data2025Monthly.reduce((sum, row) => sum + row.금액, 0);
    
    const data2024Monthly = selectedMonth !== 'all'
      ? brandFilteredData.filter(d => d.대분류 === 대분류 && d.년월 === selectedMonth.replace('2025', '2024'))
      : brandFilteredData.filter(d => d.대분류 === 대분류 && d.년월 === '202410');
    const cost2024Monthly = data2024Monthly.reduce((sum, row) => sum + row.금액, 0);
    
    const diffMonthly = cost2025Monthly - cost2024Monthly;
    const yoyMonthly = cost2024Monthly > 0 ? ((diffMonthly / cost2024Monthly) * 100) : 0;
    
    // YTD 누적 데이터 (1월 ~ 선택된 월까지)
    const data2025YTD = brandFilteredData.filter(d => d.대분류 === 대분류 && accumulatedMonths2025.includes(d.년월));
    const cost2025YTD = data2025YTD.reduce((sum, row) => sum + row.금액, 0);
    
    const data2024YTD = brandFilteredData.filter(d => d.대분류 === 대분류 && accumulatedMonths2024.includes(d.년월));
    const cost2024YTD = data2024YTD.reduce((sum, row) => sum + row.금액, 0);
    
    const diffYTD = cost2025YTD - cost2024YTD;
    const yoyYTD = cost2024YTD > 0 ? ((diffYTD / cost2024YTD) * 100) : 0;
    
    // 소분류 데이터
    const 소분류들 = Array.from(new Set([...data2025Monthly.map(d => d.소분류), ...data2025YTD.map(d => d.소분류)])).filter(c => c && c !== 'nan');
    const 소분류Data = 소분류들.map((소분류) => {
      // 당월
      const detail2025Monthly = data2025Monthly.filter(d => d.소분류 === 소분류);
      const detailCost2025Monthly = detail2025Monthly.reduce((sum, row) => sum + row.금액, 0);
      
      const detail2024Monthly = data2024Monthly.filter(d => d.소분류 === 소분류);
      const detailCost2024Monthly = detail2024Monthly.reduce((sum, row) => sum + row.금액, 0);
      
      const detailDiffMonthly = detailCost2025Monthly - detailCost2024Monthly;
      const detailYoyMonthly = detailCost2024Monthly > 0 ? ((detailDiffMonthly / detailCost2024Monthly) * 100) : 0;
      
      // YTD
      const detail2025YTD = brandFilteredData.filter(d => d.대분류 === 대분류 && d.소분류 === 소분류 && accumulatedMonths2025.includes(d.년월));
      const detailCost2025YTD = detail2025YTD.reduce((sum, row) => sum + row.금액, 0);
      
      const detail2024YTD = brandFilteredData.filter(d => d.대분류 === 대분류 && d.소분류 === 소분류 && accumulatedMonths2024.includes(d.년월));
      const detailCost2024YTD = detail2024YTD.reduce((sum, row) => sum + row.금액, 0);
      
      const detailDiffYTD = detailCost2025YTD - detailCost2024YTD;
      const detailYoyYTD = detailCost2024YTD > 0 ? ((detailDiffYTD / detailCost2024YTD) * 100) : 0;
      
      return {
        name: 소분류,
        cost2025Monthly,
        cost2024Monthly,
        diffMonthly,
        yoyMonthly,
        cost2025YTD: detailCost2025YTD,
        cost2024YTD: detailCost2024YTD,
        diffYTD: detailDiffYTD,
        yoyYTD: detailYoyYTD,
      };
    });
    
    return {
      name: 대분류,
      cost2025Monthly,
      cost2024Monthly,
      diffMonthly,
      yoyMonthly,
      cost2025YTD,
      cost2024YTD,
      diffYTD,
      yoyYTD,
      children: 소분류Data,
    };
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <div className="text-slate-800 text-xl font-medium">데이터 로딩 중...</div>
        </div>
      </div>
    );
  }

  if (allData.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-800 text-xl mb-4 font-medium">데이터가 없습니다</div>
          <Link href="/" className="text-purple-600 hover:text-purple-800 font-medium">
            ← 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200/50 bg-white backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center space-x-2 text-purple-500 hover:text-purple-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">돌아가기</span>
              </Link>
              <div className="h-6 w-px bg-purple-300" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">
                {brandName} 비용 대시보드
              </h1>
            </div>
            
            {/* 우측 상단 컨트롤 */}
            <div className="flex items-center space-x-3">
              {/* 월 선택 - 2025년만 */}
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="px-3 py-2 bg-white text-slate-800 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300"
              >
                <option value="all">전체</option>
                {availableMonths
                  .filter(month => month.startsWith('2025'))
                  .map((month) => (
                    <option key={month} value={month}>
                      {month.substring(0, 4)}년 {parseInt(month.substring(4))}월
                    </option>
                  ))}
              </select>
              
              {/* 편집 버튼 */}
              <button
                className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                onClick={() => alert('편집 기능은 준비 중입니다.')}
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">편집</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* 통계 카드 - 트렌디한 파스텔 디자인 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* 1. 총 비용 */}
          <div className="bg-gradient-to-br from-[#FFAAA5] to-[#FFD3B6] rounded-2xl p-6 shadow-md border border-[#FFAAA5]/30 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">총 비용</h3>
              <div className="w-10 h-10 bg-[#FFAAA5] rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-slate-800">
              {formatCurrency(totalCost)}
            </p>
          </div>

          {/* 2. 실판매액 */}
          <div className="bg-gradient-to-br from-[#FFEAA7] to-[#FFD3B6] rounded-2xl p-6 shadow-md border border-[#FFEAA7]/30 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">실판매액</h3>
              <div className="w-10 h-10 bg-[#FFEAA7] rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-slate-800">
              {revenue > 0 ? formatCurrency(revenue) : '-'}
            </p>
          </div>

          {/* 3. 월별 인원수 */}
          <div className="bg-gradient-to-br from-[#C7CEEA] to-[#A8E6CF] rounded-2xl p-6 shadow-md border border-[#C7CEEA]/30 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">월별 인원수</h3>
              <div className="w-10 h-10 bg-[#C7CEEA] rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-slate-800">
              {employeeCount}명
            </p>
          </div>

          {/* 4. 비용 YOY */}
          <div
            className={`bg-gradient-to-br rounded-2xl p-6 shadow-md border hover:shadow-lg transition-all duration-300 ${
              changeRate >= 0 
                ? 'from-[#FFAAA5] to-[#FFD3B6] border-[#FFAAA5]/30' 
                : 'from-[#A8E6CF] to-[#B5E5CF] border-[#A8E6CF]/30'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">비용 YOY</h3>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${changeRate >= 0 ? 'bg-[#FFAAA5]' : 'bg-[#A8E6CF]'}`}>
                {changeRate >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-white" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-white" />
                )}
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-slate-800">
              {changeRate >= 0 ? '+' : ''}
              {changeRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* 그래프 섹션 */}
        <div className="grid grid-cols-1 gap-6">
          {/* 월별 비용 추이 + YOY */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex flex-col gap-3 mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">월별 비용 추이</h2>
              
              {/* 필터 행 */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-700">본부:</label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => {
                      setSelectedDepartment(e.target.value);
                      setSelectedTeam('all');
                    }}
                    className="px-3 py-1.5 bg-white text-slate-800 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  >
                    <option value="all">전체</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-700">대분류:</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-1.5 bg-white text-slate-800 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  >
                    <option value="all">전체 (스택)</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={monthlyData.map((item) => {
                // 해당 월의 YOY 데이터 찾기
                const yoyItem = yoyData.find(y => y.month === item.month);
                return {
                  ...item,
                  'YOY (%)': yoyItem ? yoyItem['YOY (%)'] : null,
                };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#F0A3FF"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e9d5ff',
                    borderRadius: '8px',
                    color: '#1e293b',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'YOY') {
                      return [`${value}%`, name];
                    }
                    return [formatCurrency(value), name];
                  }}
                  labelFormatter={(label) => `${label}월`}
                />
                <Legend />
                {selectedCategory === 'all' ? (
                  // 전체 선택 시: 대분류별 스택
                  <>
                    {categories.map((cat) => (
                      <Bar
                        key={cat}
                        yAxisId="left"
                        dataKey={cat}
                        stackId="a"
                        fill={categoryColors[cat] || '#94a3b8'}
                        name={cat}
                      />
                    ))}
                  </>
                ) : (
                  // 특정 대분류 선택 시: 해당 대분류만 표시
                  <Bar
                    yAxisId="left"
                    dataKey={selectedCategory}
                    fill={categoryColors[selectedCategory] || '#8b5cf6'}
                    radius={[8, 8, 0, 0]}
                    name={selectedCategory}
                  />
                )}
                {/* YOY 꺾은선 */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="YOY (%)"
                  stroke="#F0A3FF"
                  strokeWidth={3}
                  dot={{ fill: '#FFAAA5', r: 6 }}
                  name="YOY"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* 대분류별 상세 분석 (소분류 + 코스트센터) */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">
                  {selectedCategoryDetail ? `${selectedCategoryDetail} > 소분류` : '인건비 > 인건비 > 소분류'}
                </h2>
                <p className="text-sm text-slate-500">소분류별 비용 및 코스트센터별 (클릭하여 계정별 보기)</p>
              </div>
              {selectedCategoryDetail && (
                <button
                  onClick={() => setSelectedCategoryDetail(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                >
                  ← 대분류로 돌아가기
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 왼쪽: 계정별 (대분류 또는 소분류) */}
              <div>
                <h3 className="text-md font-bold text-slate-700 mb-4">계정별</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart 
                    data={(() => {
                      if (selectedCategoryDetail) {
                        // 소분류 표시
                        const data2025 = brandFilteredData.filter(d => d.대분류 === selectedCategoryDetail && d.년월.startsWith('2025'));
                        const data2024 = brandFilteredData.filter(d => d.대분류 === selectedCategoryDetail && d.년월.startsWith('2024'));
                        const 소분류들 = Array.from(new Set([...data2025.map(d => d.소분류), ...data2024.map(d => d.소분류)])).filter(s => s && s !== 'nan');
                        return 소분류들.map(소분류 => {
                          const cost2025 = data2025.filter(d => d.소분류 === 소분류).reduce((sum, d) => sum + d.금액, 0);
                          const cost2024 = data2024.filter(d => d.소분류 === 소분류).reduce((sum, d) => sum + d.금액, 0);
                          return {
                            name: 소분류,
                            당해: cost2025,
                            전년: cost2024,
                          };
                        }).sort((a, b) => b.당해 - a.당해);
                      } else {
                        // 대분류 표시
                        return categories.map(cat => {
                          const data2025 = brandFilteredData.filter(d => d.대분류 === cat && d.년월.startsWith('2025'));
                          const data2024 = brandFilteredData.filter(d => d.대분류 === cat && d.년월.startsWith('2024'));
                          const cost2025 = data2025.reduce((sum, d) => sum + d.금액, 0);
                          const cost2024 = data2024.reduce((sum, d) => sum + d.금액, 0);
                          return {
                            name: cat,
                            당해: cost2025,
                            전년: cost2024,
                          };
                        }).sort((a, b) => b.당해 - a.당해);
                      }
                    })()}
                    layout="vertical"
                    onClick={(data) => {
                      if (!selectedCategoryDetail && data && data.activeLabel) {
                        // 대분류 클릭 시 소분류로 드릴다운
                        setSelectedCategoryDetail(data.activeLabel);
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#94a3b8" tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" width={120} style={{ fontSize: '11px' }} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e9d5ff',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="당해" fill="#FFAAA5" cursor={!selectedCategoryDetail ? 'pointer' : 'default'} />
                    <Bar dataKey="전년" fill="#C7CEEA" cursor={!selectedCategoryDetail ? 'pointer' : 'default'} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* 오른쪽: 코스트센터별 */}
              <div>
                <h3 className="text-md font-bold text-slate-700 mb-4">
                  {selectedCategoryDetail ? `${selectedCategoryDetail} > 코스트센터별` : '인건비 > 코스트센터별'}
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart 
                    data={(() => {
                      let data2025, data2024;
                      if (selectedCategoryDetail) {
                        data2025 = brandFilteredData.filter(d => d.대분류 === selectedCategoryDetail && d.년월.startsWith('2025'));
                        data2024 = brandFilteredData.filter(d => d.대분류 === selectedCategoryDetail && d.년월.startsWith('2024'));
                      } else {
                        // 전체 데이터
                        data2025 = brandFilteredData.filter(d => d.년월.startsWith('2025'));
                        data2024 = brandFilteredData.filter(d => d.년월.startsWith('2024'));
                      }
                      const 본부들 = Array.from(new Set([...data2025.map(d => d.본부), ...data2024.map(d => d.본부)])).filter(b => b && b !== 'nan');
                      return 본부들.map(본부 => {
                        const cost2025 = data2025.filter(d => d.본부 === 본부).reduce((sum, d) => sum + d.금액, 0);
                        const cost2024 = data2024.filter(d => d.본부 === 본부).reduce((sum, d) => sum + d.금액, 0);
                        return {
                          name: 본부,
                          당해: cost2025,
                          전년: cost2024,
                        };
                      }).sort((a, b) => b.당해 - a.당해);
                    })()}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#94a3b8" tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" width={120} style={{ fontSize: '11px' }} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e9d5ff',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="당해" fill="#FFAAA5" />
                    <Bar dataKey="전년" fill="#C7CEEA" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 비용 계정 상세 분석 (드릴다운 테이블) */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-2">비용 계정 상세 분석 (계층형)</h2>
                <p className="text-sm text-slate-600">
                  {selectedMonth !== 'all' 
                    ? `2025년 ${parseInt(selectedMonth.substring(4))}월 기준`
                    : '2025년 전체 기준'}
                </p>
              </div>
              
              {/* 전체 펼치기/접기 버튼 */}
              <button
                onClick={toggleAllRows}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
              >
                {allExpanded ? (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span>전체 접기</span>
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    <span>전체 펼치기</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse table-fixed">
                <colgroup>
                  <col className="w-64" /> {/* 계정 */}
                  <col className="w-28" /> {/* 전년(당월) */}
                  <col className="w-28" /> {/* 당년(당월) */}
                  <col className="w-28" /> {/* 차이 */}
                  <col className="w-24" /> {/* YOY */}
                  <col className="w-28" /> {/* YTD(전년) */}
                  <col className="w-28" /> {/* YTD(당년) */}
                  <col className="w-24" /> {/* YOY(YTD) */}
                </colgroup>
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">계정 (천위안)</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">전년(당월)</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">당년(당월)</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">차이</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">YOY</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">YTD(전년)</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">YTD(당년)</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">YOY(YTD)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* 총합계 행 */}
                  <tr className="bg-purple-100 border-b-2 border-purple-200">
                    <td className="py-4 px-4 font-bold text-purple-900 text-base">
                      총 합계
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-purple-900 text-base">
                      {formatCurrency(drilldownData.reduce((sum, row) => sum + row.cost2024Monthly, 0))}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-purple-900 text-base">
                      {formatCurrency(drilldownData.reduce((sum, row) => sum + row.cost2025Monthly, 0))}
                    </td>
                    <td className={`py-4 px-4 text-right font-bold text-base ${
                      (drilldownData.reduce((sum, row) => sum + row.diffMonthly, 0)) >= 0 
                        ? 'text-red-700' 
                        : 'text-green-700'
                    }`}>
                      {(() => {
                        const totalDiff = drilldownData.reduce((sum, row) => sum + row.diffMonthly, 0);
                        return (totalDiff >= 0 ? '+' : '') + formatCurrency(totalDiff);
                      })()}
                    </td>
                    <td className={`py-4 px-4 text-right font-bold text-base ${
                      (() => {
                        const total2024 = drilldownData.reduce((sum, row) => sum + row.cost2024Monthly, 0);
                        const total2025 = drilldownData.reduce((sum, row) => sum + row.cost2025Monthly, 0);
                        const totalYoy = total2024 > 0 ? ((total2025 - total2024) / total2024) * 100 : 0;
                        return totalYoy >= 0 ? 'text-red-700' : 'text-green-700';
                      })()
                    }`}>
                      {(() => {
                        const total2024 = drilldownData.reduce((sum, row) => sum + row.cost2024Monthly, 0);
                        const total2025 = drilldownData.reduce((sum, row) => sum + row.cost2025Monthly, 0);
                        const totalYoy = total2024 > 0 ? ((total2025 - total2024) / total2024) * 100 : 0;
                        return (totalYoy >= 0 ? '+' : '') + totalYoy.toFixed(1) + '%';
                      })()}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-purple-900 text-base">
                      {formatCurrency(drilldownData.reduce((sum, row) => sum + row.cost2024YTD, 0))}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-purple-900 text-base">
                      {formatCurrency(drilldownData.reduce((sum, row) => sum + row.cost2025YTD, 0))}
                    </td>
                    <td className={`py-4 px-4 text-right font-bold text-base ${
                      (() => {
                        const totalYTD2024 = drilldownData.reduce((sum, row) => sum + row.cost2024YTD, 0);
                        const totalYTD2025 = drilldownData.reduce((sum, row) => sum + row.cost2025YTD, 0);
                        const totalYoyYTD = totalYTD2024 > 0 ? ((totalYTD2025 - totalYTD2024) / totalYTD2024) * 100 : 0;
                        return totalYoyYTD >= 0 ? 'text-red-700' : 'text-green-700';
                      })()
                    }`}>
                      {(() => {
                        const totalYTD2024 = drilldownData.reduce((sum, row) => sum + row.cost2024YTD, 0);
                        const totalYTD2025 = drilldownData.reduce((sum, row) => sum + row.cost2025YTD, 0);
                        const totalYoyYTD = totalYTD2024 > 0 ? ((totalYTD2025 - totalYTD2024) / totalYTD2024) * 100 : 0;
                        return (totalYoyYTD >= 0 ? '+' : '') + totalYoyYTD.toFixed(1) + '%';
                      })()}
                    </td>
                  </tr>
                  
                  {drilldownData.map((row, idx) => (
                    <>
                      {/* 대분류 행 */}
                      <tr 
                        key={row.name}
                        id={`category-${row.name}`}
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => setExpandedRows(prev => ({...prev, [row.name]: !prev[row.name]}))}
                      >
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          <div className="flex items-center space-x-2">
                            {expandedRows[row.name] ? (
                              <ChevronDown className="w-4 h-4 text-slate-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-600" />
                            )}
                            <span>{row.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-700">{formatCurrency(row.cost2024Monthly)}</td>
                        <td className="py-3 px-4 text-right text-slate-700">{formatCurrency(row.cost2025Monthly)}</td>
                        <td className={`py-3 px-4 text-right font-medium ${row.diffMonthly >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {row.diffMonthly >= 0 ? '+' : ''}{formatCurrency(row.diffMonthly)}
                        </td>
                        <td className={`py-3 px-4 text-right font-semibold ${row.yoyMonthly >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {row.yoyMonthly >= 0 ? '+' : ''}{row.yoyMonthly.toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-right text-slate-700">{formatCurrency(row.cost2024YTD)}</td>
                        <td className="py-3 px-4 text-right text-slate-700">{formatCurrency(row.cost2025YTD)}</td>
                        <td className={`py-3 px-4 text-right font-semibold ${row.yoyYTD >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {row.yoyYTD >= 0 ? '+' : ''}{row.yoyYTD.toFixed(1)}%
                        </td>
                      </tr>
                      
                      {/* 소분류 행 (중분류 건너뛰고 바로 표시) */}
                      {expandedRows[row.name] && row.children.map((detailRow) => (
                        <tr 
                          key={`${row.name}-${detailRow.name}`}
                          className="border-b border-purple-100 hover:bg-purple-100 bg-purple-50"
                        >
                          <td className="py-2 px-4 text-slate-700 text-sm bg-purple-50">
                            <div className="ml-8">{detailRow.name}</div>
                          </td>
                          <td className="py-2 px-4 text-right text-slate-600 text-sm bg-purple-50">{formatCurrency(detailRow.cost2024Monthly)}</td>
                          <td className="py-2 px-4 text-right text-slate-600 text-sm bg-purple-50">{formatCurrency(detailRow.cost2025Monthly)}</td>
                          <td className={`py-2 px-4 text-right text-sm bg-purple-50 ${detailRow.diffMonthly >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {detailRow.diffMonthly >= 0 ? '+' : ''}{formatCurrency(detailRow.diffMonthly)}
                          </td>
                          <td className={`py-2 px-4 text-right text-sm bg-purple-50 ${detailRow.yoyMonthly >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {detailRow.yoyMonthly >= 0 ? '+' : ''}{detailRow.yoyMonthly.toFixed(1)}%
                          </td>
                          <td className="py-2 px-4 text-right text-slate-600 text-sm bg-purple-50">{formatCurrency(detailRow.cost2024YTD)}</td>
                          <td className="py-2 px-4 text-right text-slate-600 text-sm bg-purple-50">{formatCurrency(detailRow.cost2025YTD)}</td>
                          <td className={`py-2 px-4 text-right text-sm bg-purple-50 ${detailRow.yoyYTD >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {detailRow.yoyYTD >= 0 ? '+' : ''}{detailRow.yoyYTD.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
