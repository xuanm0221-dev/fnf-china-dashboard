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
  ReferenceLine,
} from 'recharts';
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, DollarSign, Edit, ChevronRight, ChevronDown, Users, Sparkles, Brain, Save, X } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

// 트렌디한 파스텔 컬러 팔레트
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

// 브랜드별 색상 매핑
const BRAND_COLORS: { [key: string]: { primary: string; secondary: string; accent: string; light: string } } = {
  'mlb': {
    primary: '#4040AD',
    secondary: '#5555C5',
    accent: '#6B7BC5',
    light: '#E8E9F9',
  },
  'mlb-kids': {
    primary: '#6B93CB',
    secondary: '#8AABDB',
    accent: '#A3BFEB',
    light: '#EBF2FA',
  },
  'discovery': {
    primary: '#9CD9C6',
    secondary: '#B5E5D8',
    accent: '#CEEDE3',
    light: '#F0FAF7',
  },
  'common': {
    primary: '#EFEFEF',
    secondary: '#D5D5D5',
    accent: '#C0C0C0',
    light: '#F8F8F8',
  },
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

  // AI 인사이트 편집 state
  const [insights, setInsights] = useState<{[key: string]: {trend?: string; insight?: string; analysis?: string; costItem?: string}}>({});
  const [editingBox, setEditingBox] = useState<string | null>(null); // 편집 중인 박스 키
  const [editingBoxData, setEditingBoxData] = useState<{trend?: string; insight?: string; analysis?: string; costItem?: string}>({});

  const brandName = BRAND_NAMES[brandId] || brandId;

  // 인사이트 로드
  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const response = await fetch('/api/insights');
      if (response.ok) {
        const data = await response.json();
        setInsights(data || {});
      }
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const startEditingBox = (boxKey: string) => {
    setEditingBox(boxKey);
    // 저장된 데이터가 있으면 사용하고, 없으면 빈 객체로 시작
    const savedData = insights[boxKey] || {};
    setEditingBoxData(savedData);
  };

  const cancelEditingBox = () => {
    setEditingBox(null);
    setEditingBoxData({});
  };

  const saveBoxInsights = async (boxKey: string) => {
    try {
      const updatedInsights = {
        ...insights,
        [boxKey]: editingBoxData
      };
      setInsights(updatedInsights);
      
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedInsights),
      });
      
      if (response.ok) {
        const result = await response.json();
        setEditingBox(null);
        setEditingBoxData({});
        if (result.message) {
          console.log(result.message);
        }
        alert('인사이트가 저장되었습니다.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error saving insights:', errorData);
        alert('저장에 실패했습니다. 로컬 개발 환경에서만 파일 저장이 가능합니다.');
      }
    } catch (error) {
      console.error('Error saving insights:', error);
      alert('저장에 실패했습니다. 네트워크 오류가 발생했을 수 있습니다.');
    }
  };

  const updateEditingBoxData = (type: string, value: string) => {
    setEditingBoxData(prev => {
      const updated = {
        ...prev,
        [type]: value
      };
      return updated;
    });
  };

  // 편집 가능한 인사이트 컴포넌트 (박스 단위 편집)
  const EditableInsight = ({ 
    boxKey,
    type, 
    defaultText, 
    label, 
    icon: Icon, 
    iconColor 
  }: { 
    boxKey: string;
    type: string; 
    defaultText: string; 
    label: string; 
    icon: any; 
    iconColor: string;
  }) => {
    const isEditing = editingBox === boxKey;
    const savedText = insights[boxKey]?.[type as keyof typeof insights[typeof boxKey]] as string | undefined;
    const displayText = savedText || defaultText;
    
    // 편집 모드일 때는 편집 박스 데이터를 사용, 없으면 기본 텍스트 사용
    const editingValue = editingBoxData[type as keyof typeof editingBoxData] as string | undefined;
    const editingText = isEditing 
      ? (editingValue !== undefined ? editingValue : (savedText || defaultText))
      : displayText;

    // HTML 태그 제거 (표시용)
    const cleanText = (text: string) => {
      return text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    };

    return (
      <div className="flex items-start gap-2">
        <Icon className={`w-4 h-4 ${iconColor} mt-0.5 flex-shrink-0`} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-800">{label}:</span>
          </div>
          {isEditing ? (
            <textarea
              value={editingText}
              onChange={(e) => updateEditingBoxData(type, e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              rows={3}
              placeholder="인사이트 텍스트를 입력하세요..."
            />
          ) : (
            <p className="text-slate-600 mt-1 whitespace-pre-wrap">{cleanText(displayText)}</p>
          )}
        </div>
      </div>
    );
  };

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
                    브랜드: cols[0]?.trim() || '',
                    본부: cols[1]?.trim() || '',
                    팀: cols[2]?.trim() || '',
                    대분류: cols[3]?.trim() || '',
                    중분류: cols[4]?.replace(/"/g, '').trim() || '', // 큰따옴표 제거 및 공백 제거
                    소분류: cols[5]?.trim() || '', // 공백 제거
                    계정과목: cols[6]?.trim() || '',
                    금액: amount,
                    년월: cols[8]?.trim() || '',
                    비고: (cols[9] || '').trim()
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
  const allCategories = Array.from(new Set(brandFilteredData.map((d) => d.대분류))).filter(c => c && c !== 'nan');
  
  // 대분류 정렬 순서 정의
  const categoryOrder = [
    '광고비', 
    '인건비', 
    '복리후생비', 
    '출장비', 
    '수주회', 
    '차량유지비', 
    '임차료', 
    '감가상각비', 
    '감가상각', 
    '세금과공과', 
    '기타'
  ];
  
  // 지정된 순서대로 정렬하고, 순서에 없는 항목은 뒤에 추가
  const categories = [
    ...categoryOrder.filter(cat => allCategories.includes(cat)),
    ...allCategories.filter(cat => !categoryOrder.includes(cat)).sort()
  ];
  
  // 대분류별 색상 매핑 (제공된 색상 팔레트 - 사용자 지정 + 나머지 배합)
  const categoryColors: { [key: string]: string } = {
    // 유지할 색상 (요청사항)
    '광고비': '#C1B2FF', // 연보라
    '인건비': '#87C5FF', // 하늘색
    '복리후생비': '#87E4C6', // 민트
    '수주회': '#F7DB6C', // 옐로우
    '출장비': '#F5A84C', // 오렌지
    
    // 새로 지정할 색상 (겹치지 않게)
    '차량유지비': '#87CEEB', // 스카이 블루 (인건비와 구분되는 하늘색)
    '임차료': '#FFF9C4', // 파스텔 노랑 (수주회와 구분되는 부드러운 노랑)
    '감가상각비': '#7C3AED', // 짙은 보라 (다른 색상과 구분)
    '감가상각': '#7C3AED', // 짙은 보라 (감가상각비와 동일)
    '세금과공과': '#FFD1DC', // 파스텔 분홍 (다른 색상과 구분)
    '기타': '#A3F27A', // 라이트그린
    '지급수수료': '#F38181', // 코랄
    
    // 기타 항목들 (겹치지 않게)
    '광고선전비': '#C1B2FF', // 연보라 (광고비와 동일)
    '사가상각비(시설)': '#7C3AED', // 짙은 보라 (감가상각비와 동일)
    'VMD/매장부수대': '#AA96DA', // 라벤더
    '샘플비(제작/구입)': '#FCBAD3', // 라이트핑크
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

  // YOY 계산 (전년 동월 대비)
  const currentYearMonth = selectedMonth && selectedMonth !== 'all' ? selectedMonth : '202510';
  const previousYearMonth = currentYearMonth.replace('2025', '2024');
  
  const currentYearCost = brandFilteredData
    .filter(d => d.년월 === currentYearMonth)
    .reduce((sum, row) => sum + row.금액, 0);
  
  const previousYearCost = brandFilteredData
    .filter(d => d.년월 === previousYearMonth)
    .reduce((sum, row) => sum + row.금액, 0);
  
  const changeRate = previousYearCost > 0 
    ? (currentYearCost / previousYearCost) * 100
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
      
      // YOY 계산 (당년/전년 × 100)
      const yoyRate = prev2024Cost > 0 ? (current2025Cost / prev2024Cost) * 100 : 0;
      
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
    
    return new Intl.NumberFormat('ko-KR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valueInK) + 'K';
  };

  // 숫자 포맷팅 함수 (천단위 콤마)
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(value);
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
    const 소분류들 = Array.from(new Set([...data2025Monthly.map(d => d.소분류), ...data2025YTD.map(d => d.소분류)])).filter(c => c && c !== 'nan' && c.trim() !== '');
    
    // 디버깅: 대분류별 소분류 확인
    if (대분류 === '감가상각비' || 대분류 === '지급수수료') {
      console.log(`[${대분류}] 소분류 목록:`, 소분류들);
      console.log(`[${대분류}] data2025Monthly 샘플:`, data2025Monthly.slice(0, 3).map(d => ({ 소분류: d.소분류, 금액: d.금액 })));
    }
    
    const 소분류Data = 소분류들.map((소분류) => {
      // 당월 - 소분류별로 필터링
      const detail2025Monthly = data2025Monthly.filter(d => d.소분류 === 소분류 && d.소분류 && d.소분류.trim() !== '');
      const detailCost2025Monthly = detail2025Monthly.reduce((sum, row) => sum + row.금액, 0);
      
      const detail2024Monthly = data2024Monthly.filter(d => d.소분류 === 소분류 && d.소분류 && d.소분류.trim() !== '');
      const detailCost2024Monthly = detail2024Monthly.reduce((sum, row) => sum + row.금액, 0);
      
      // 디버깅: 소분류별 값 확인
      if ((대분류 === '감가상각비' || 대분류 === '지급수수료') && 소분류들.length > 0) {
        console.log(`[${대분류} > ${소분류}] detailCost2025Monthly:`, detailCost2025Monthly, 'detailCost2024Monthly:', detailCost2024Monthly);
      }
      
      const detailDiffMonthly = detailCost2025Monthly - detailCost2024Monthly;
      const detailYoyMonthly = detailCost2024Monthly > 0 ? ((detailDiffMonthly / detailCost2024Monthly) * 100) : 0;
      
      // YTD - 소분류별로 필터링
      const detail2025YTD = brandFilteredData.filter(d => 
        d.대분류 === 대분류 && 
        d.소분류 === 소분류 && 
        d.소분류 && 
        d.소분류.trim() !== '' &&
        accumulatedMonths2025.includes(d.년월)
      );
      const detailCost2025YTD = detail2025YTD.reduce((sum, row) => sum + row.금액, 0);
      
      const detail2024YTD = brandFilteredData.filter(d => 
        d.대분류 === 대분류 && 
        d.소분류 === 소분류 && 
        d.소분류 && 
        d.소분류.trim() !== '' &&
        accumulatedMonths2024.includes(d.년월)
      );
      const detailCost2024YTD = detail2024YTD.reduce((sum, row) => sum + row.금액, 0);
      
      const detailDiffYTD = detailCost2025YTD - detailCost2024YTD;
      const detailYoyYTD = detailCost2024YTD > 0 ? ((detailDiffYTD / detailCost2024YTD) * 100) : 0;
      
      return {
        name: 소분류,
        cost2025Monthly: detailCost2025Monthly,
        cost2024Monthly: detailCost2024Monthly,
        diffMonthly: detailDiffMonthly,
        yoyMonthly: detailYoyMonthly,
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
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* 통계 카드 - SHADCN 스타일 with 브랜드 컬러 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* 1. 총 비용 */}
          <Card 
            className="border-l-4 hover:shadow-xl transition-all duration-300"
            style={{ borderLeftColor: BRAND_COLORS[brandId]?.primary }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                총 비용
              </CardTitle>
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
                style={{ backgroundColor: BRAND_COLORS[brandId]?.light }}
              >
                <DollarSign 
                  className="w-5 h-5" 
                  style={{ color: BRAND_COLORS[brandId]?.primary }}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-slate-900">
                {formatCurrency(totalCost)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                CNY (천위안)
              </p>
            </CardContent>
          </Card>

          {/* 2. 실판매액 */}
          <Card 
            className="border-l-4 hover:shadow-xl transition-all duration-300"
            style={{ borderLeftColor: BRAND_COLORS[brandId]?.secondary }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                실판매액
              </CardTitle>
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
                style={{ backgroundColor: BRAND_COLORS[brandId]?.light }}
              >
                <TrendingUp 
                  className="w-5 h-5" 
                  style={{ color: BRAND_COLORS[brandId]?.secondary }}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-slate-900">
                {revenue > 0 ? formatCurrency(revenue) : '-'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                CNY (천위안)
              </p>
            </CardContent>
          </Card>

          {/* 3. 월별 인원수 */}
          <Card 
            className="border-l-4 hover:shadow-xl transition-all duration-300"
            style={{ borderLeftColor: BRAND_COLORS[brandId]?.accent }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                월별 인원수
              </CardTitle>
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
                style={{ backgroundColor: BRAND_COLORS[brandId]?.light }}
              >
                <Users 
                  className="w-5 h-5" 
                  style={{ color: BRAND_COLORS[brandId]?.accent }}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-slate-900">
                {employeeCount}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                명
              </p>
            </CardContent>
          </Card>

          {/* 4. 비용 YOY */}
          <Card 
            className="border-l-4 hover:shadow-xl transition-all duration-300"
            style={{ 
              borderLeftColor: changeRate >= 100 ? '#ef4444' : '#3b82f6'
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                비용 YOY
              </CardTitle>
              <div 
                className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${
                  changeRate >= 100 ? 'bg-red-100' : 'bg-blue-100'
                }`}
              >
                {changeRate >= 100 ? (
                  <TrendingUp className="w-5 h-5 text-red-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-blue-600" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div 
                className={`text-3xl font-bold tracking-tight ${
                  changeRate >= 100 ? 'text-red-600' : 'text-blue-600'
                }`}
              >
                {formatNumber(changeRate)}%
              </div>
              <p className="text-xs text-slate-500 mt-1">
                전년 동월 대비 (당년/전년 × 100)
              </p>
            </CardContent>
          </Card>
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
                  <label className="text-sm font-medium text-slate-700">부서:</label>
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
                    <option value="all">전체</option>
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
                  stroke="#475569"
                  style={{ fontSize: '12px', fontWeight: 500 }}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#475569"
                  style={{ fontSize: '12px', fontWeight: 500 }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#475569"
                  style={{ fontSize: '12px', fontWeight: 500 }}
                  tickFormatter={(value) => `${formatNumber(value)}%`}
                  domain={[0, 'dataMax']}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const currentMonth = label;
                      const year = selectedMonth && selectedMonth !== 'all' 
                        ? selectedMonth.substring(0, 4) 
                        : '2025';
                      
                      // 총계 계산
                      let totalCost = 0;
                      const categoryData: { name: string; value: number; color: string }[] = [];
                      
                      payload.forEach((entry: any) => {
                        if (entry.dataKey !== 'YOY (%)' && entry.value > 0) {
                          totalCost += entry.value;
                          categoryData.push({
                            name: entry.name || entry.dataKey,
                            value: entry.value,
                            color: entry.color || entry.fill,
                          });
                        }
                      });
                      
                      // YOY 데이터 찾기
                      const yoyEntry = payload.find((entry: any) => entry.dataKey === 'YOY (%)');
                      const yoyValue = yoyEntry ? yoyEntry.value : null;
                      
                      return (
                        <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-4 min-w-[280px]">
                          {/* 헤더 */}
                          <div className="border-b border-slate-200 pb-3 mb-3">
                            <div className="text-lg font-bold text-slate-800">
                              {year}년 {currentMonth}월
                            </div>
                            <div className="mt-2">
                              <div className="text-xs text-slate-500">총비용</div>
                              <div className="text-xl font-bold text-slate-900">
                                {formatCurrency(totalCost)}
                              </div>
                            </div>
                            {yoyValue !== null && (
                              <div className="mt-2">
                                <div className="text-xs text-slate-500">YOY (당년/전년)</div>
                                  <div 
                                  className={`text-base font-semibold ${
                                    Number(yoyValue) >= 100 ? 'text-red-600' : 'text-green-600'
                                  }`}
                                >
                                  {formatNumber(Number(yoyValue))}%
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* 카테고리별 비용 */}
                          <div className="space-y-2">
                            <div className="text-xs font-semibold text-slate-600 mb-2">카테고리별 비용</div>
                            {categoryData
                              .sort((a, b) => b.value - a.value)
                              .map((item, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-slate-700 font-medium">{item.name}</span>
                                  </div>
                                  <span className="font-semibold text-slate-800">
                                    {formatCurrency(item.value)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                  iconSize={10}
                  formatter={(value) => (
                    <span style={{ color: '#475569', fontWeight: 500, fontSize: '13px' }}>
                      {value}
                    </span>
                  )}
                />
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
                {/* 100% 기준선 */}
                <ReferenceLine 
                  yAxisId="right"
                  y={100} 
                  stroke="#94a3b8" 
                  strokeDasharray="3 3" 
                  strokeWidth={1}
                  label={{ value: "100%", position: "right", fill: "#94a3b8", fontSize: 11 }}
                />
                {/* YOY 꺾은선 */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="YOY (%)"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ fill: '#dc2626', r: 6 }}
                  name="YOY"
                />
              </ComposedChart>
            </ResponsiveContainer>

            {/* 비용추이 AI분석 박스 */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200/50 relative">
                <div className="absolute top-4 right-4">
                  {editingBox === 'monthly-trend' ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => saveBoxInsights('monthly-trend')}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="저장"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={cancelEditingBox}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors"
                        title="취소"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditingBox('monthly-trend')}
                      className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors"
                      title="편집"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 pr-8">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-slate-800">비용추이 AI분석</h3>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                        AI
                      </span>
                    </div>
                    <div className="space-y-3 text-sm text-slate-700">
                      <EditableInsight
                        boxKey="monthly-trend"
                        type="trend"
                        defaultText={(() => {
                          if (monthlyData.length === 0) return '데이터가 없습니다.';
                          const categoryLabel = selectedCategory !== 'all' ? `${selectedCategory}의 ` : '';
                          const filteredMonthlyData = monthlyData.map(m => {
                            if (selectedCategory !== 'all' && m[selectedCategory]) {
                              return { ...m, 분석비용: m[selectedCategory] || 0 };
                            }
                            return { ...m, 분석비용: m.총비용 || 0 };
                          });
                          const recentMonths = filteredMonthlyData.slice(-3).filter(m => m.분석비용 > 0);
                          const avgCost = recentMonths.length > 0 
                            ? recentMonths.reduce((sum, m) => sum + (m.분석비용 || 0), 0) / recentMonths.length 
                            : 0;
                          const firstMonth = filteredMonthlyData.find(m => m.분석비용 > 0);
                          const lastMonth = [...filteredMonthlyData].reverse().find(m => m.분석비용 > 0);
                          if (!firstMonth || !lastMonth) return '비용 데이터를 분석할 수 없습니다.';
                          const firstTotal = firstMonth.분석비용 || 0;
                          const lastTotal = lastMonth.분석비용 || 0;
                          const trend = lastTotal > firstTotal ? '증가' : lastTotal < firstTotal ? '감소' : '유지';
                          const changePercent = firstTotal > 0 
                            ? Math.abs(((lastTotal - firstTotal) / firstTotal) * 100).toFixed(1) 
                            : '0';
                          return `${categoryLabel}최근 3개월 평균 비용은 ${formatCurrency(avgCost)}이며, 전체 기간 동안 비용이 ${trend} 추세를 보이고 있습니다 (${changePercent}% 변화).`;
                        })()}
                        label="트렌드 분석"
                        icon={TrendingUp}
                        iconColor="text-purple-600"
                      />
                      <EditableInsight
                        boxKey="monthly-trend"
                        type="insight"
                        defaultText={(() => {
                          if (monthlyData.length === 0) return '데이터가 없습니다.';
                          const categoryLabel = selectedCategory !== 'all' ? `${selectedCategory}의 ` : '';
                          const filteredMonthlyData = monthlyData.map(m => {
                            if (selectedCategory !== 'all' && m[selectedCategory]) {
                              return { ...m, 분석비용: m[selectedCategory] || 0 };
                            }
                            return { ...m, 분석비용: m.총비용 || 0 };
                          });
                          const maxMonth = filteredMonthlyData.reduce((max, m) => {
                            const maxCost = max.분석비용 || 0;
                            const currentCost = m.분석비용 || 0;
                            return currentCost > maxCost ? m : max;
                          }, filteredMonthlyData[0]);
                          const minMonth = filteredMonthlyData.reduce((min, m) => {
                            const minCost = min.분석비용 || 0;
                            const currentCost = m.분석비용 || 0;
                            return currentCost > 0 && (minCost === 0 || currentCost < minCost) ? m : min;
                          }, filteredMonthlyData[0]);
                          if (maxMonth && maxMonth.분석비용 > 0) {
                            const categoryText = selectedCategory !== 'all' ? `${selectedCategory} ` : '';
                            return `${categoryText}${maxMonth.month}월에 가장 높은 비용(${formatCurrency(maxMonth.분석비용)})이 발생했습니다. ${minMonth && minMonth.month !== maxMonth.month ? `${minMonth.month}월(${formatCurrency(minMonth.분석비용)})과 비교하여` : ''} 비용 최적화 기회를 찾아보세요.`;
                          }
                          return '비용 데이터를 분석할 수 없습니다.';
                        })()}
                        label="인사이트"
                        icon={Brain}
                        iconColor="text-blue-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 대분류별 상세 분석 (소분류 + 코스트센터) */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-1">
                  {selectedCategoryDetail ? `${selectedCategoryDetail} > 소분류` : `${brandName} 코스트센터별 비용 상세`}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 왼쪽: 계정별 (대분류 또는 소분류) */}
              <div>
                <h3 className="text-md font-bold text-slate-700 mb-2">계정별</h3>
                <ResponsiveContainer width="100%" height={350}>
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
                    <XAxis 
                      type="number" 
                      stroke="#475569" 
                      style={{ fontSize: '12px', fontWeight: 500 }}
                      tickFormatter={(value) => formatCurrency(value)}
                      domain={[0, 'auto']}
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="#475569" 
                      width={120} 
                      style={{ fontSize: '11px', fontWeight: 500 }} 
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const currentYear = Number(payload[0]?.value) || 0;
                          const previousYear = Number(payload[1]?.value) || 0;
                          const diff = currentYear - previousYear;
                          const yoy = previousYear > 0 ? ((currentYear / previousYear) * 100) : 0;
                          
                          return (
                            <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-4 min-w-[240px]">
                              <div className="border-b border-slate-200 pb-2 mb-3">
                                <div className="text-base font-bold text-slate-800">{label}</div>
                              </div>
                              <div className="space-y-2">
                                {payload.map((entry: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: entry.fill }}
                                      />
                                      <span className="text-slate-700 font-medium">{entry.name}</span>
                                    </div>
                                    <span className="font-semibold text-slate-800">
                                      {formatCurrency(entry.value)}
                                    </span>
                                  </div>
                                ))}
                                <div className="pt-2 border-t border-slate-100">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 font-medium">차이</span>
                                    <span className={`font-semibold ${diff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                      {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm mt-1">
                                    <span className="text-slate-600 font-medium">YOY</span>
                                    <span className={`font-semibold ${yoy >= 100 ? 'text-red-600' : 'text-green-600'}`}>
                                      {formatNumber(yoy)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '12px' }}
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span style={{ color: '#475569', fontWeight: 500, fontSize: '12px' }}>
                          {value}
                        </span>
                      )}
                    />
                    <Bar dataKey="당해" fill="#F7A7C9" cursor={!selectedCategoryDetail ? 'pointer' : 'default'} />
                    <Bar dataKey="전년" fill="#87C5FF" cursor={!selectedCategoryDetail ? 'pointer' : 'default'} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* 오른쪽: 코스트센터별 */}
              <div>
                <h3 className="text-md font-bold text-slate-700 mb-2">
                  {selectedCategoryDetail ? `${selectedCategoryDetail} > 코스트센터별` : '인건비 > 코스트센터별'}
                </h3>
                <ResponsiveContainer width="100%" height={350}>
                  {(() => {
                    let data2025, data2024;
                    if (selectedCategoryDetail) {
                      data2025 = brandFilteredData.filter(d => d.대분류 === selectedCategoryDetail && d.년월.startsWith('2025'));
                      data2024 = brandFilteredData.filter(d => d.대분류 === selectedCategoryDetail && d.년월.startsWith('2024'));
                    } else {
                      // 전체 데이터
                      data2025 = brandFilteredData.filter(d => d.년월.startsWith('2025'));
                      data2024 = brandFilteredData.filter(d => d.년월.startsWith('2024'));
                    }
                    const 본부들 = Array.from(new Set([...data2025.map(d => d.본부), ...data2024.map(d => d.본부)]))
                      .filter(b => b && b !== 'nan' && b.trim() !== '')
                      .filter(b => b); // 빈 값 제거
                    const chartData = 본부들.map(본부 => {
                      const cost2025 = Math.max(data2025.filter(d => d.본부 === 본부).reduce((sum, d) => sum + d.금액, 0), 0);
                      const cost2024 = Math.max(data2024.filter(d => d.본부 === 본부).reduce((sum, d) => sum + d.금액, 0), 0);
                      return {
                        name: (본부 && 본부.trim()) || '미지정',
                        당해: cost2025,
                        전년: cost2024,
                      };
                    }).filter(item => item.당해 > 0 || item.전년 > 0) // 값이 있는 항목만 표시
                      .sort((a, b) => b.당해 - a.당해);
                    
                    // 최대값 계산 (0부터 시작하도록)
                    const maxValue = chartData.length > 0 
                      ? Math.max(...chartData.map(item => Math.max(item.당해, item.전년)), 0)
                      : 0;
                    const xAxisDomain = maxValue > 0 ? [0, maxValue * 1.1] : [0, 1000]; // 10% 여유 공간 추가
                    
                    return (
                      <BarChart 
                        data={chartData}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          type="number" 
                          stroke="#475569" 
                          style={{ fontSize: '12px', fontWeight: 500 }}
                          tickFormatter={(value) => formatCurrency(value)}
                          domain={xAxisDomain}
                        />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="#475569" 
                      width={150} 
                      style={{ fontSize: '11px', fontWeight: 500 }} 
                      tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const currentYear = Number(payload[0]?.value) || 0;
                          const previousYear = Number(payload[1]?.value) || 0;
                          const diff = currentYear - previousYear;
                          const yoy = previousYear > 0 ? ((currentYear / previousYear) * 100) : 0;
                          
                          return (
                            <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-4 min-w-[240px]">
                              <div className="border-b border-slate-200 pb-2 mb-3">
                                <div className="text-base font-bold text-slate-800">{label}</div>
                              </div>
                              <div className="space-y-2">
                                {payload.map((entry: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: entry.fill }}
                                      />
                                      <span className="text-slate-700 font-medium">{entry.name}</span>
                                    </div>
                                    <span className="font-semibold text-slate-800">
                                      {formatCurrency(entry.value)}
                                    </span>
                                  </div>
                                ))}
                                <div className="pt-2 border-t border-slate-100">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 font-medium">차이</span>
                                    <span className={`font-semibold ${diff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                      {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm mt-1">
                                    <span className="text-slate-600 font-medium">YOY</span>
                                    <span className={`font-semibold ${yoy >= 100 ? 'text-red-600' : 'text-green-600'}`}>
                                      {formatNumber(yoy)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '12px' }}
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span style={{ color: '#475569', fontWeight: 500, fontSize: '12px' }}>
                          {value}
                        </span>
                      )}
                    />
                        <Bar dataKey="당해" fill="#F7A7C9" />
                        <Bar dataKey="전년" fill="#87C5FF" />
                      </BarChart>
                    );
                  })()}
                </ResponsiveContainer>
              </div>
            </div>

            {/* 코스트센터별 비용 AI분석 박스 */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              {(() => {
                // 분석할 데이터 준비
                let analysisData2025, analysisData2024;
                const currentCategory = selectedCategoryDetail || selectedCategory;
                
                if (currentCategory && currentCategory !== 'all') {
                  analysisData2025 = brandFilteredData.filter(d => d.대분류 === currentCategory && d.년월.startsWith('2025'));
                  analysisData2024 = brandFilteredData.filter(d => d.대분류 === currentCategory && d.년월.startsWith('2024'));
                } else {
                  analysisData2025 = brandFilteredData.filter(d => d.년월.startsWith('2025'));
                  analysisData2024 = brandFilteredData.filter(d => d.년월.startsWith('2024'));
                }
                
                // 코스트센터별 비용 계산
                const costCenterData2025 = analysisData2025.reduce((acc: any, d) => {
                  acc[d.본부] = (acc[d.본부] || 0) + d.금액;
                  return acc;
                }, {});
                
                const costCenterData2024 = analysisData2024.reduce((acc: any, d) => {
                  acc[d.본부] = (acc[d.본부] || 0) + d.금액;
                  return acc;
                }, {});
                
                const costCenters = Array.from(new Set([
                  ...Object.keys(costCenterData2025),
                  ...Object.keys(costCenterData2024)
                ])).filter(b => b && b !== 'nan');
                
                // 최고/최저 비용 코스트센터 찾기
                const costCenterStats = costCenters.map(center => ({
                  name: center,
                  cost2025: costCenterData2025[center] || 0,
                  cost2024: costCenterData2024[center] || 0,
                })).filter(stat => stat.cost2025 > 0);
                
                const maxCenter = costCenterStats.reduce((max, curr) => 
                  curr.cost2025 > max.cost2025 ? curr : max, costCenterStats[0] || { name: '', cost2025: 0, cost2024: 0 }
                );
                
                const minCenter = costCenterStats.reduce((min, curr) => 
                  curr.cost2025 > 0 && (min.cost2025 === 0 || curr.cost2025 < min.cost2025) ? curr : min, 
                  costCenterStats[0] || { name: '', cost2025: 0, cost2024: 0 }
                );
                
                // 총 비용 계산
                const total2025 = analysisData2025.reduce((sum, d) => sum + d.금액, 0);
                const total2024 = analysisData2024.reduce((sum, d) => sum + d.금액, 0);
                const yoyPercent = total2024 > 0 ? ((total2025 - total2024) / total2024 * 100).toFixed(1) : '0';
                const yoyTrend = total2025 > total2024 ? '증가' : total2025 < total2024 ? '감소' : '유지';
                
                // 비중 계산
                const maxCenterShare = total2025 > 0 ? ((maxCenter.cost2025 / total2025) * 100).toFixed(1) : '0';
                
                const insightKey = `cost-center-${currentCategory === 'all' ? 'all' : currentCategory}`;
                
                return (
                  <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border border-green-200/50 relative">
                    <div className="absolute top-4 right-4">
                      {editingBox === insightKey ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => saveBoxInsights(insightKey)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="저장"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={cancelEditingBox}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors"
                            title="취소"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditingBox(insightKey)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors"
                          title="편집"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 pr-8">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-slate-800">
                            {selectedCategoryDetail 
                              ? `${selectedCategoryDetail} AI분석` 
                              : selectedCategory !== 'all' 
                                ? `${selectedCategory} AI분석`
                                : '코스트센터별 비용 AI분석'}
                          </h3>
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            AI
                          </span>
                        </div>
                        <div className="space-y-3 text-sm text-slate-700">
                          <EditableInsight
                            boxKey={insightKey}
                            type="trend"
                            defaultText={`${currentCategory !== 'all' ? `${currentCategory}의 ` : '전체 '}2025년 총 비용은 ${formatCurrency(total2025)}이며, 전년 대비 ${yoyTrend} 추세입니다 (${Math.abs(parseFloat(yoyPercent))}% 변화). ${total2025 > total2024 ? ' 비용 관리가 필요한 시점입니다.' : ' 비용 절감 노력이 효과를 보이고 있습니다.'}`}
                            label="비용 추이"
                            icon={TrendingUp}
                            iconColor="text-green-600"
                          />
                          <EditableInsight
                            boxKey={insightKey}
                            type="analysis"
                            defaultText={maxCenter && maxCenter.cost2025 > 0 ? `${maxCenter.name}이(가) 가장 높은 비용(${formatCurrency(maxCenter.cost2025)}, 전체의 ${maxCenterShare}%)을 차지하고 있습니다. ${maxCenter.cost2024 > 0 ? ` 전년 대비 ${maxCenter.cost2025 > maxCenter.cost2024 ? '증가' : '감소'} 추세입니다.` : ''} ${minCenter && minCenter.name !== maxCenter.name && minCenter.cost2025 > 0 ? `${minCenter.name}과 비교하여 ${formatCurrency(maxCenter.cost2025 - minCenter.cost2025)}의 차이가 있습니다.` : ''}` : '분석할 데이터가 없습니다.'}
                            label="코스트센터 분석"
                            icon={Users}
                            iconColor="text-teal-600"
                          />
                          <EditableInsight
                            boxKey={insightKey}
                            type="insight"
                            defaultText={maxCenter && maxCenter.cost2025 > 0 ? `${maxCenter.name}의 비용이 전체의 ${maxCenterShare}%를 차지하므로, 이 코스트센터의 비용 구조를 상세히 분석하여 최적화 기회를 찾는 것을 권장합니다. ${parseFloat(maxCenterShare) > 30 ? ' 높은 비중을 차지하는 만큼 작은 개선도 큰 효과를 가져올 수 있습니다.' : ''}` : '비용 데이터를 분석할 수 없습니다.'}
                            label="인사이트"
                            icon={Brain}
                            iconColor="text-blue-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* 비용 계정 상세 분석 (드릴다운 테이블) */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-2">비용 계정 상세 분석</h2>
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

            {/* 비용 계정 AI 인사이트 분석 박스 */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              {(() => {
                if (drilldownData.length === 0) {
                  return (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200/50">
                      <p className="text-slate-600">분석할 데이터가 없습니다.</p>
                    </div>
                  );
                }

                // 총합계 계산
                const total2025Monthly = drilldownData.reduce((sum, row) => sum + row.cost2025Monthly, 0);
                const total2024Monthly = drilldownData.reduce((sum, row) => sum + row.cost2024Monthly, 0);
                const total2025YTD = drilldownData.reduce((sum, row) => sum + row.cost2025YTD, 0);
                const total2024YTD = drilldownData.reduce((sum, row) => sum + row.cost2024YTD, 0);
                
                // 최고 증가 항목 (YTD 기준)
                const maxIncrease = drilldownData.reduce((max, curr) => {
                  const currIncrease = curr.cost2025YTD - curr.cost2024YTD;
                  const maxIncrease = max.cost2025YTD - max.cost2024YTD;
                  return currIncrease > maxIncrease ? curr : max;
                }, drilldownData[0]);
                
                // 최고 감소 항목 (YTD 기준)
                const maxDecrease = drilldownData.reduce((min, curr) => {
                  const currDecrease = curr.cost2025YTD - curr.cost2024YTD;
                  const minDecrease = min.cost2025YTD - min.cost2024YTD;
                  return currDecrease < minDecrease ? curr : min;
                }, drilldownData[0]);
                
                // 최고 비용 항목 (YTD 기준)
                const maxCost = drilldownData.reduce((max, curr) => 
                  curr.cost2025YTD > max.cost2025YTD ? curr : max, drilldownData[0]
                );
                
                // YTD 증가율 계산
                const ytdIncrease = total2024YTD > 0 
                  ? ((total2025YTD - total2024YTD) / total2024YTD * 100).toFixed(1) 
                  : '0';
                
                // 월간 증가율 계산
                const monthlyIncrease = total2024Monthly > 0 
                  ? ((total2025Monthly - total2024Monthly) / total2024Monthly * 100).toFixed(1) 
                  : '0';
                
                // 최고 비용 항목 비중
                const maxCostShare = total2025YTD > 0 
                  ? ((maxCost.cost2025YTD / total2025YTD) * 100).toFixed(1) 
                  : '0';

                const insightKey = `account-insight-${selectedMonth}`;
                const maxIncreaseAmount = maxIncrease.cost2025YTD - maxIncrease.cost2024YTD;
                const maxDecreaseAmount = maxDecrease.cost2025YTD - maxDecrease.cost2024YTD;

                return (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200/50 relative">
                    <div className="absolute top-4 right-4">
                      {editingBox === insightKey ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => saveBoxInsights(insightKey)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="저장"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={cancelEditingBox}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors"
                            title="취소"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditingBox(insightKey)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors"
                          title="편집"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 pr-8">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-slate-800">비용 계정 AI 인사이트 분석</h3>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                            AI
                          </span>
                        </div>
                        <div className="space-y-3 text-sm text-slate-700">
                          <EditableInsight
                            boxKey={insightKey}
                            type="trend"
                            defaultText={`${selectedMonth !== 'all' ? `2025년 ${parseInt(selectedMonth.substring(4))}월 비용은 ${formatCurrency(total2025Monthly)}이며, 전년 동월 대비 ${parseFloat(monthlyIncrease) >= 0 ? '증가' : '감소'} 추세입니다 (${Math.abs(parseFloat(monthlyIncrease))}% 변화). ` : ''}YTD 누적 비용은 ${formatCurrency(total2025YTD)}이며, 전년 대비 ${parseFloat(ytdIncrease) >= 0 ? '증가' : '감소'} 추세입니다 (${Math.abs(parseFloat(ytdIncrease))}% 변화).${parseFloat(ytdIncrease) > 10 ? ' 비용 증가율이 높아 주의가 필요합니다.' : ''}`}
                            label="전체 비용 추이"
                            icon={TrendingUp}
                            iconColor="text-blue-600"
                          />
                          <EditableInsight
                            boxKey={insightKey}
                            type="costItem"
                            defaultText={`${maxCost.name}이(가) YTD 기준으로 가장 높은 비용(${formatCurrency(maxCost.cost2025YTD)}, 전체의 ${maxCostShare}%)을 차지하고 있습니다. ${maxCost.yoyYTD > 10 ? ` 전년 대비 ${maxCost.yoyYTD.toFixed(1)}% 증가하여 집중적인 관리가 필요합니다.` : ''}${maxCost.yoyYTD < -10 ? ` 전년 대비 ${Math.abs(maxCost.yoyYTD).toFixed(1)}% 감소하여 긍정적인 변화입니다.` : ''}`}
                            label="주요 비용 항목"
                            icon={DollarSign}
                            iconColor="text-indigo-600"
                          />
                          <EditableInsight
                            boxKey={insightKey}
                            type="insight"
                            defaultText={maxIncreaseAmount > 0 && maxDecreaseAmount < 0 
                              ? `${maxIncrease.name}이(가) 전년 대비 가장 큰 증가(${formatCurrency(maxIncreaseAmount)})를 보이고 있어, 비용 구조 재검토가 필요합니다. 반면 ${maxDecrease.name}은(는) ${formatCurrency(Math.abs(maxDecreaseAmount))} 감소하여 효율 개선 효과가 있었습니다.${parseFloat(maxCostShare) > 30 ? ' 최고 비용 항목이 전체의 30% 이상을 차지하므로, 이 항목의 최적화가 전체 비용 절감에 큰 영향을 미칠 수 있습니다.' : ''}`
                              : maxIncreaseAmount > 0
                                ? `${maxIncrease.name}이(가) 전년 대비 가장 큰 증가(${formatCurrency(maxIncreaseAmount)})를 보이고 있어, 집중적인 관리가 필요합니다. 비용 증가 원인을 분석하여 효율적인 대응 방안을 수립하는 것을 권장합니다.`
                                : '대부분의 항목에서 비용이 감소 또는 유지되고 있어 긍정적인 추세입니다. 지속적인 모니터링을 통해 비용 효율성을 유지하시기 바랍니다.'}
                            label="인사이트"
                            icon={Brain}
                            iconColor="text-purple-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
