'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

interface MLBData {
  연월: string;
  년도: number;
  월: number;
  본부: string;
  부서명: string;
  대분류: string;
  중분류: string;
  계정과목: string;
  금액: number;
}

interface CategoryStats {
  name: string;
  total: number;
  yoy: number;
  color: string;
}

// 대분류별 색상 매핑 (세련된 톤다운 팔레트)
const CATEGORY_COLORS: { [key: string]: string } = {
  '인건비': '#7C9CBF',          // 부드러운 블루
  '광고선전비': '#E69A99',      // 차분한 코랄
  '기타': '#D4C5A9',            // 베이지 골드
  '지급수수료': '#9BB19C',      // 세이지 그린
  '사가상각비(시설)': '#B4A5C7', // 라벤더 그레이
  'VMD/매장부수대': '#D4A5A5',  // 더스티 로즈
  '샘플비(제작/구입)': '#C9B18F', // 샌드 베이지
  '복리후생비': '#8FB0B0',      // 더스티 틸
  '출장비': '#A8A4C7',          // 퍼플 그레이
  '감가상각비': '#9CADA4',      // 민트 그레이
};

export default function MLB2025Analysis() {
  const [data, setData] = useState<MLBData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/data/mlb_china_data.json');
      if (response.ok) {
        const jsonData: MLBData[] = await response.json();
        
        // 2025년 데이터만 필터링
        const data2025 = jsonData.filter(d => d.년도 === 2025);
        setData(data2025);
        processChartData(jsonData, data2025);
      }
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
    }
    setLoading(false);
  };

  const processChartData = (allData: MLBData[], data2025: MLBData[]) => {
    // 2025년 월별, 대분류별 집계
    const monthlyData: { [key: string]: any } = {};
    const categoryMap = new Map<string, { total2025: number; total2024: number }>();

    // 2025년 데이터 집계
    data2025.forEach(item => {
      const month = item.월;
      const category = item.대분류;
      
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month: `${month}월`,
          monthNum: month,
          total2025: 0,
          total2024: 0,
        };
      }

      if (!monthlyData[month][category]) {
        monthlyData[month][category] = 0;
      }

      monthlyData[month][category] += item.금액;
      monthlyData[month].total2025 += item.금액;

      // 대분류별 총합 (2025년)
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { total2025: 0, total2024: 0 });
      }
      const catData = categoryMap.get(category)!;
      catData.total2025 += item.금액;
    });

    // 2024년 동월 데이터로 YOY 계산
    const data2024 = allData.filter(d => d.년도 === 2024);
    data2024.forEach(item => {
      const month = item.월;
      const category = item.대분류;
      
      // 1-10월만 (2025년 데이터와 비교 가능한 월)
      if (month >= 1 && month <= 10) {
        // 월별 2024년 합계
        if (monthlyData[month]) {
          monthlyData[month].total2024 += item.금액;
        }

        if (!categoryMap.has(category)) {
          categoryMap.set(category, { total2025: 0, total2024: 0 });
        }
        const catData = categoryMap.get(category)!;
        catData.total2024 += item.금액;
      }
    });

    // 월별 YOY 계산
    Object.keys(monthlyData).forEach(month => {
      const data = monthlyData[month];
      if (data.total2024 > 0) {
        data.yoy = ((data.total2025 - data.total2024) / data.total2024) * 100;
      } else {
        data.yoy = 0;
      }
    });

    // 차트 데이터 정렬 (1월 ~ 10월)
    const sortedMonths = Object.keys(monthlyData)
      .map(Number)
      .sort((a, b) => a - b);
    
    const chartArray = sortedMonths.map(month => monthlyData[month]);
    setChartData(chartArray);

    // 대분류별 통계 및 YOY 계산
    const stats: CategoryStats[] = Array.from(categoryMap.entries())
      .map(([name, data]) => {
        const yoy = data.total2024 > 0 
          ? ((data.total2025 - data.total2024) / data.total2024) * 100 
          : 0;
        
        return {
          name,
          total: data.total2025,
          yoy,
          color: CATEGORY_COLORS[name] || '#94a3b8',
        };
      })
      .sort((a, b) => b.total - a.total); // 금액 높은 순으로 정렬

    setCategoryStats(stats);
  };

  const formatCurrency = (value: number) => {
    // CNY를 K 단위로 변환 (1,000 = 1K)
    const inK = value / 1000;
    if (inK >= 1) {
      return `${inK.toLocaleString('en-US', { maximumFractionDigits: 0 })}K`;
    }
    return value.toFixed(0);
  };

  const formatYOY = (value: number) => {
    return `${value >= 0 ? '' : ''}${value.toFixed(1)}%`;
  };

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  // 통계 계산
  const totalCost = data.reduce((sum, item) => sum + item.금액, 0);
  const dataCount = data.length;
  const avgYOY = categoryStats.length > 0 
    ? categoryStats.reduce((sum, cat) => sum + cat.yoy, 0) / categoryStats.length 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-white text-xl">데이터 로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">돌아가기</span>
            </Link>
            <div className="h-6 w-px bg-slate-300" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">
              MLB 2025년 비용 분석
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 차트 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">2025년 월별 비용 분석</h2>
                  <div className="text-xs text-slate-500 mt-1">
                    막대를 클릭하면 월별 YOY를 확인할 수 있습니다
                  </div>
                </div>
              </div>

              {/* 선택된 월 정보 */}
              {selectedMonth !== null && chartData.find(d => d.monthNum === selectedMonth) && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-blue-900">
                        2025년 {selectedMonth}월
                      </div>
                      <div className="text-xs text-blue-700 mt-1">
                        총비용: {formatCurrency(chartData.find(d => d.monthNum === selectedMonth)?.total2025 || 0)}
                      </div>
                      <div className="text-xs text-blue-700">
                        전년: {formatCurrency(chartData.find(d => d.monthNum === selectedMonth)?.total2024 || 0)}
                      </div>
                    </div>
                    <div className={`text-right ${
                      (chartData.find(d => d.monthNum === selectedMonth)?.yoy || 0) >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      <div className="text-xs">YOY</div>
                      <div className="text-2xl font-bold">
                        {formatYOY(chartData.find(d => d.monthNum === selectedMonth)?.yoy || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <ResponsiveContainer width="100%" height={400}>
                <BarChart 
                  data={chartData}
                  onClick={(data) => {
                    if (data && data.activePayload && data.activePayload[0]) {
                      const monthNum = data.activePayload[0].payload.monthNum;
                      setSelectedMonth(monthNum === selectedMonth ? null : monthNum);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: string) => {
                      return [formatCurrency(value), name];
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px' }}
                    iconType="circle"
                  />

                  {/* 대분류별 스택 바 */}
                  {categoryStats.map((category, index) => (
                    <Bar
                      key={category.name}
                      dataKey={category.name}
                      stackId="cost"
                      fill={category.color}
                      cursor="pointer"
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 오른쪽: 카테고리별 비율 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4">카테고리별 비율</h3>
              
              <div className="space-y-2">
                {categoryStats.map((category) => {
                  const percentage = (category.total / totalCost) * 100;
                  const isExpanded = expandedCategories.has(category.name);

                  return (
                    <div key={category.name} className="border border-slate-200 rounded-lg overflow-hidden">
                      {/* 카테고리 헤더 */}
                      <button
                        onClick={() => toggleCategory(category.name)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <div className="text-left flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-800 truncate">
                              {category.name}
                            </div>
                            <div className="text-xs text-slate-600">
                              {formatCurrency(category.total)}
                            </div>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        )}
                      </button>

                      {/* YOY 토글 영역 */}
                      {isExpanded && (
                        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
                          <div className="text-xs text-slate-600 mb-1">전년 대비 증감률</div>
                          <div className={`text-lg font-bold ${
                            category.yoy >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            YOY: {formatYOY(category.yoy)}
                          </div>
                          <div className="mt-2 text-xs text-slate-500">
                            비율: {percentage.toFixed(1)}%
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 전체 통계 */}
              <div className="mt-6 pt-4 border-t border-slate-200">
                <div className="text-sm text-slate-600 mb-2">전체 통계</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">총 비용:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(totalCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">데이터 건수:</span>
                    <span className="font-bold text-slate-800">{dataCount.toLocaleString()}건</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

