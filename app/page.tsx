'use client';

import Link from 'next/link';
import { TrendingUp, ShoppingBag, Compass, Users, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';

// 브랜드 기본 정보 - 모던 컬러 팔레트
const brandInfo = [
  {
    id: 'mlb',
    name: 'MLB',
    icon: 'M',
    color: 'from-[#4040AD] to-[#5555C5]',
    bgColor: 'bg-gradient-to-br from-[#4040AD] to-[#5555C5]',
    borderColor: 'border-[#4040AD]',
  },
  {
    id: 'mlb-kids',
    name: 'MLB KIDS',
    icon: 'MK',
    color: 'from-[#6B93CB] to-[#8AABDB]',
    bgColor: 'bg-gradient-to-br from-[#6B93CB] to-[#8AABDB]',
    borderColor: 'border-[#6B93CB]',
  },
  {
    id: 'discovery',
    name: 'DISCOVERY',
    icon: 'DX',
    color: 'from-[#9CD9C6] to-[#B5E5D8]',
    bgColor: 'bg-gradient-to-br from-[#9CD9C6] to-[#B5E5D8]',
    borderColor: 'border-[#9CD9C6]',
  },
  {
    id: 'common',
    name: '공통',
    icon: '공통',
    color: 'from-[#EFEFEF] to-[#D5D5D5]',
    bgColor: 'bg-gradient-to-br from-[#EFEFEF] to-[#D5D5D5]',
    borderColor: 'border-[#EFEFEF]',
  },
];

// 2025년 사용 가능한 월
const availableMonths = [
  { value: '202501', label: '2025년 1월' },
  { value: '202502', label: '2025년 2월' },
  { value: '202503', label: '2025년 3월' },
  { value: '202504', label: '2025년 4월' },
  { value: '202505', label: '2025년 5월' },
  { value: '202506', label: '2025년 6월' },
  { value: '202507', label: '2025년 7월' },
  { value: '202508', label: '2025년 8월' },
  { value: '202509', label: '2025년 9월' },
  { value: '202510', label: '2025년 10월' },
];

interface BrandStats {
  totalCost: number;
  employees: number;
  revenue: number;
  revenueYOY: number; // 매출액 YOY
  costYOY: number; // 영업비 YOY
  operatingExpenseRatio: number; // 영업비율
  costPerPerson: number; // 인당비용
  costDetails: {
    인건비: number;
    광고선전비: number;
    기타영업비: number;
    [key: string]: number;
  };
}

interface BrandData {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  stats: BrandStats;
}

export default function Home() {
  const [selectedMonth, setSelectedMonth] = useState('202510'); // 2025년 10월
  const [brands, setBrands] = useState<BrandData[]>([]);
  const [loading, setLoading] = useState(true);

  // CSV 데이터 로드 및 통계 계산
  useEffect(() => {
    loadBrandData();
  }, [selectedMonth]);

  const loadBrandData = async () => {
    setLoading(true);
    const brandData: BrandData[] = [];

    for (const brand of brandInfo) {
      const stats = await loadBrandStats(brand.id, selectedMonth);
      brandData.push({
        ...brand,
        stats,
      });
    }

    setBrands(brandData);
    setLoading(false);
  };

  const loadBrandStats = async (brandId: string, month: string): Promise<BrandStats> => {
    try {
      // 브랜드 ID에 따른 파일명 접두사
      let filePrefix = brandId;
      if (brandId === 'mlb-kids') {
        filePrefix = 'kids';
      }

      const year = month.substring(0, 4);
      const monthNum = parseInt(month.substring(4));

      // 비용 데이터 로드
      const costUrl = `/data/cost_${filePrefix}_${month}.csv`;
      const costResponse = await fetch(costUrl);
      if (!costResponse.ok) {
        console.error(`Failed to load ${costUrl}: ${costResponse.status} ${costResponse.statusText}`);
        return getDefaultStats();
      }

      const csvText = await costResponse.text();
      if (!csvText || csvText.trim().length === 0) {
        console.error(`Empty CSV file: ${costUrl}`);
        return getDefaultStats();
      }

      const rows = csvText.split('\n').filter(row => row.trim().length > 0);
      if (rows.length <= 1) {
        console.error(`No data rows in CSV: ${costUrl}`);
        return getDefaultStats();
      }

      // 헤더 제거
      const dataRows = rows.slice(1);

      let totalCost = 0;
      const costDetails: { [key: string]: number } = {
        인건비: 0,
        광고선전비: 0,
        기타영업비: 0,
      };

      // CSV 파싱 (큰따옴표 처리)
      for (const row of dataRows) {
        if (!row.trim()) continue;
        
        const cols: string[] = [];
        let inQuotes = false;
        let current = '';
        
        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            cols.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        if (current) cols.push(current);

        // 최소 8개 컬럼 필요 (브랜드,본부,팀,대분류,중분류,소분류,계정과목,금액)
        if (cols.length >= 8) {
          const amountStr = cols[7]?.replace(/[,"]/g, '').trim() || '0';
          const amount = parseFloat(amountStr) || 0;
          
          if (!isNaN(amount) && amount > 0) {
            totalCost += amount;

            // 대분류별 집계
            const 대분류 = cols[3]?.replace(/"/g, '').trim() || '';
            if (대분류 === '인건비') {
              costDetails.인건비 += amount;
            } else if (대분류 === '광고비' || 대분류 === '광고선전비') {
              costDetails.광고선전비 += amount;
            } else {
              costDetails.기타영업비 += amount;
            }
          }
        }
      }

      // 인원수 로드
      let employees = 0;
      try {
        const empResponse = await fetch(`/data/인원수_${year}.csv`);
        if (empResponse.ok) {
          const empText = await empResponse.text();
          const empRows = empText.split('\n');
          const headers = empRows[0].split(',');
          
          const brandColumnMap: { [key: string]: string } = {
            'mlb': 'MLB',
            'mlb-kids': 'KIDS',
            'discovery': 'DX',
            'common': '공통'
          };
          
          const columnName = brandColumnMap[brandId];
          if (columnName) {
            const columnIndex = headers.findIndex(h => h.trim() === columnName);
            if (columnIndex !== -1) {
              const monthStr = `${year.substring(2)}년${monthNum}월`;
              const targetRow = empRows.find(r => r.startsWith(monthStr));
              if (targetRow) {
                const cols = targetRow.split(',');
                const empStr = cols[columnIndex]?.trim().replace('명', '');
                employees = parseInt(empStr) || 0;
              }
            }
          }
        }
      } catch (e) {
        console.error('Error loading employee data:', e);
      }

      // 실판매출액 로드
      let revenue = 0;
      if (brandId !== 'common') {
        try {
          const revResponse = await fetch(`/data/실판매출_${year}.csv`);
          if (revResponse.ok) {
            const revText = await revResponse.text();
            const revRows = revText.split('\n');
            
            const brandColumnMap: { [key: string]: string } = {
              'mlb': 'MLB',
              'mlb-kids': 'KIDS',
              'discovery': 'DISCOVERY',
            };
            
            const columnName = brandColumnMap[brandId];
            if (columnName) {
              // 헤더 파싱
              const headerRow = revRows[0];
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
              if (columnIndex !== -1) {
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthName = monthNames[monthNum - 1];
                const targetRow = revRows.find(r => r.trim().startsWith(monthName));
                
                if (targetRow) {
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
                  
                  if (cols[columnIndex]) {
                    const revStr = cols[columnIndex].replace(/["]/g, '').replace(/,/g, '').trim();
                    revenue = parseFloat(revStr) || 0;
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error('Error loading revenue data:', e);
        }
      }

      // 전년 동기 데이터 로드 (YOY 계산)
      const prevYear = year === '2025' ? '2024' : '2023';
      const prevMonth = `${prevYear}${month.substring(4)}`;
      
      let prevCost = 0;
      let prevRevenue = 0;
      
      try {
        const prevCostResponse = await fetch(`/data/cost_${filePrefix}_${prevMonth}.csv`);
        if (prevCostResponse.ok) {
          const prevCsvText = await prevCostResponse.text();
          const prevRows = prevCsvText.split('\n').slice(1);
          
          for (const row of prevRows) {
            if (!row.trim()) continue;
            const cols: string[] = [];
            let inQuotes = false;
            let current = '';
            
            for (let i = 0; i < row.length; i++) {
              const char = row[i];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                cols.push(current);
                current = '';
              } else {
                current += char;
              }
            }
            if (current) cols.push(current);
            
            if (cols.length >= 8) {
              prevCost += parseFloat(cols[7]?.replace(/[,"]/g, '') || '0') || 0;
            }
          }
        }
        
        if (brandId !== 'common') {
          const prevRevResponse = await fetch(`/data/실판매출_${prevYear}.csv`);
          if (prevRevResponse.ok) {
            const prevRevText = await prevRevResponse.text();
            const prevRevRows = prevRevText.split('\n');
            
            const brandColumnMap: { [key: string]: string } = {
              'mlb': 'MLB',
              'mlb-kids': 'KIDS',
              'discovery': 'DISCOVERY',
            };
            
            const columnName = brandColumnMap[brandId];
            if (columnName) {
              const headerRow = prevRevRows[0];
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
              if (columnIndex !== -1) {
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthName = monthNames[monthNum - 1];
                const targetRow = prevRevRows.find(r => r.trim().startsWith(monthName));
                
                if (targetRow) {
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
                  
                  if (cols[columnIndex]) {
                    const revStr = cols[columnIndex].replace(/["]/g, '').replace(/,/g, '').trim();
                    prevRevenue = parseFloat(revStr) || 0;
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('Error loading previous year data:', e);
      }

      // YOY 계산
      // 영업비 YOY: 당년/전년 * 100 (비율)
      const costYOY = prevCost > 0 ? (totalCost / prevCost) * 100 : 0;
      // 매출액 YOY: 증감률
      const revenueYOY = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;

      // 영업비율 계산 (총비용 / 실판매출액 * 100)
      const operatingExpenseRatio = revenue > 0 ? (totalCost / revenue) * 100 : 0;
      
      // 인당비용 계산 (총비용(K) / 인원수, 소숫점 없이)
      const costPerPerson = employees > 0 ? Math.round((totalCost / 1000) / employees) : 0;

      const stats = {
        totalCost: Math.round(totalCost),
        employees,
        revenue: Math.round(revenue),
        revenueYOY: parseFloat(revenueYOY.toFixed(1)),
        costYOY: parseFloat(costYOY.toFixed(1)),
        operatingExpenseRatio: parseFloat(operatingExpenseRatio.toFixed(1)),
        costPerPerson,
        costDetails: {
          인건비: Math.round(costDetails.인건비 / 1000),
          광고선전비: Math.round(costDetails.광고선전비 / 1000),
          기타영업비: Math.round(costDetails.기타영업비 / 1000),
        },
      };

      // 디버깅: 데이터 로드 확인
      console.log(`✅ Loaded stats for ${brandId} (${month}):`, {
        totalCost: stats.totalCost,
        employees: stats.employees,
        revenue: stats.revenue,
        rowsProcessed: dataRows.length,
      });

      return stats;
    } catch (error) {
      console.error(`❌ Error loading stats for ${brandId} (${month}):`, error);
      return getDefaultStats();
    }
  };

  const getDefaultStats = (): BrandStats => {
    return {
      totalCost: 0,
      employees: 0,
      revenue: 0,
      revenueYOY: 0,
      costYOY: 0,
      operatingExpenseRatio: 0,
      costPerPerson: 0,
      costDetails: {
        인건비: 0,
        광고선전비: 0,
        기타영업비: 0,
      },
    };
  };

  const getPrevMonthCost = async (brandId: string, month: string): Promise<number> => {
    try {
      let filePrefix = brandId;
      if (brandId === 'mlb-kids') {
        filePrefix = 'kids';
      }

      const response = await fetch(`/data/cost_${filePrefix}_${month}.csv`);
      if (!response.ok) return 0;

      const csvText = await response.text();
      const rows = csvText.split('\n').slice(1);

      let total = 0;
      for (const row of rows) {
        if (!row.trim()) continue;
        const cols = row.split(',');
        if (cols.length >= 9) {
          total += parseFloat(cols[7].replace(/[,"]/g, '')) || 0;
        }
      }
      return total;
    } catch {
      return 0;
    }
  };

  const getPreviousMonth = (month: string): string | null => {
    const currentIndex = availableMonths.findIndex(m => m.value === month);
    if (currentIndex > 0) {
      return availableMonths[currentIndex - 1].value;
    }
    return null;
  };

  const formatNumber = (num: number) => {
    if (num === 0) return '0';
    
    // K 단위 (천 단위)로 변환
    const valueInK = num / 1000;
    
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valueInK);
  };

  const formatPercent = (num: number, decimals: number = 1) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white backdrop-blur-sm border-b border-slate-200/50 shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#F4BD42] to-[#F8D36E] rounded-2xl flex items-center justify-center shadow-md">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
                  F&F CHINA
              </h1>
                <p className="text-slate-600 text-sm font-medium">비용 분석 대시보드</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-slate-50 px-5 py-3 rounded-xl border border-slate-200 shadow-sm">
              <Calendar className="w-5 h-5 text-slate-600" />
              <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
              >
                  {availableMonths.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
              </select>
              </div>
              {!loading && (
                <div className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-800">{brands.length}개</span> 브랜드
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* 브랜드 선택 섹션 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">브랜드 선택</h2>
            <p className="text-slate-600 text-sm">
              분석할 브랜드를 클릭하여 상세 대시보드로 이동합니다
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500">브랜드</div>
            <div className="text-2xl font-bold text-slate-800">{brands.length}개</div>
          </div>
        </div>

        {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden animate-pulse">
                <div className="bg-slate-200 p-6 h-32"></div>
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="bg-white rounded-2xl shadow-lg border-2 border-slate-300 hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              {/* 브랜드 헤더 */}
              <div className={`bg-gradient-to-br ${brand.color} p-6 text-white relative border-b-2 border-white/20`}>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {brand.icon}
                  </div>
                  <h3 className="text-2xl font-bold">{brand.name}</h3>
                </div>
                <div className="flex justify-end items-center space-x-2 mt-2">
                  <div className="px-2 py-1 bg-white/50 backdrop-blur-sm rounded-lg border border-white/80 shadow-sm">
                    <div className="text-[10px] text-slate-700 mb-0.5 font-medium">매출액YOY</div>
                    <div className="text-xs font-bold text-slate-900">
                      {brand.stats.revenueYOY > 0 ? '+' : ''}{formatPercent(brand.stats.revenueYOY)}%
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-white/50 backdrop-blur-sm rounded-lg border border-white/80 shadow-sm">
                    <div className="text-[10px] text-slate-700 mb-0.5 font-medium">영업비YOY</div>
                    <div className="text-xs font-bold text-slate-900">
                      {formatPercent(brand.stats.costYOY)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* 통계 정보 */}
              <div className="p-6">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-xs text-slate-500 mb-1 font-medium">총비용</div>
                    <div className="text-lg font-bold text-slate-800">
                      {formatNumber(brand.stats.totalCost)} <span className="text-xs font-normal text-slate-500">K</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500 mb-1 font-medium">인원수</div>
                    <div className="text-lg font-bold text-slate-800">
                      {brand.stats.employees} <span className="text-xs font-normal text-slate-500">명</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500 mb-1 font-medium">실판매출액</div>
                    <div className="text-lg font-bold text-slate-800">
                      {brand.stats.revenue > 0 ? (
                        <>
                          {formatNumber(brand.stats.revenue)} <span className="text-xs font-normal text-slate-500">K</span>
                        </>
                      ) : '-'}
                    </div>
                  </div>
                </div>

                {/* 영업비율 & 인당비용 */}
                <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-slate-200">
                  <div className="text-center">
                    <div className="text-xs text-slate-500 mb-1 font-medium">영업비율</div>
                    <div className="text-lg font-bold text-blue-600">
                      {brand.stats.operatingExpenseRatio.toFixed(1)}%
                    </div>
                    </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500 mb-1 font-medium">인당비용</div>
                    <div className="text-lg font-bold text-purple-600">
                      {brand.stats.costPerPerson}K
                    </div>
                  </div>
                </div>

                {/* 영업비 상세보기 - 항상 열림 */}
                <div className="mb-4">
                  <div className="text-xs text-slate-500 mb-2 font-medium">영업비 상세보기 (공통비 제외)</div>
                  <div className="space-y-2">
                    {(() => {
                      // costDetails를 배열로 변환하고 값 기준으로 정렬
                      const costArray = Object.entries(brand.stats.costDetails)
                        .map(([key, value]) => ({ key, value: value as number }))
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 3); // 상위 3개만
                      
                      // 항상 3개를 표시 (값이 0이거나 없으면 빈 줄)
                      const displayItems = [];
                      for (let i = 0; i < 3; i++) {
                        if (costArray[i] && costArray[i].value > 0) {
                          displayItems.push(
                            <div key={costArray[i].key} className="flex justify-between text-xs">
                              <span className="text-slate-600">{costArray[i].key}</span>
                              <span className="font-semibold text-slate-800">{costArray[i].value}K</span>
                            </div>
                          );
                        } else {
                          // 빈 줄 추가
                          displayItems.push(
                            <div key={`empty-${i}`} className="flex justify-between text-xs opacity-0">
                              <span className="text-slate-600">-</span>
                              <span className="font-semibold text-slate-800">-</span>
                            </div>
                          );
                        }
                      }
                      return displayItems;
                    })()}
                  </div>
                </div>

                {/* 전체 대시보드 보기 버튼 */}
                <Link href={`/dashboard/${brand.id}?month=${selectedMonth}`}>
                  <button className={`w-full py-2.5 px-4 bg-gradient-to-r ${brand.color} text-white font-semibold rounded-lg hover:shadow-md transition-all duration-300 text-sm`}>
                    전체 대시보드 보기
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
        )}
        
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-slate-600 text-sm">
          <p>에프앤에프 차이나 비용 분석 대시보드 © 2024-2025</p>
        </div>
      </footer>
    </div>
  );
}
