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
  ComposedChart,
  Line,
  ReferenceLine,
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

// 대분류별 색상 매핑 (밝은 파스텔 팔레트)
const CATEGORY_COLORS: { [key: string]: string } = {
  '인건비': '#A8DADC',          // 밝은 민트 블루
  '광고선전비': '#FFD93D',      // 노란색
  '기타': '#FFE4B5',            // 피치 파스텔
  '지급수수료': '#C7CEEA',      // 라벤더 블루
  '사가상각비(시설)': '#E0BBE4', // 연보라 파스텔
  'VMD/매장부수대': '#FEC8D8',  // 로즈 파스텔
  '샘플비(제작/구입)': '#FFDAB9', // 아프리콧 파스텔
  '복리후생비': '#B4E7CE',      // 민트 그린
  '출장비': '#D4A5F8',          // 퍼플 파스텔
  '감가상각비': '#C1E1C1',      // 세이지 파스텔
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
      const response = await fetch('/api/mlb-data');
      if (response.ok) {
        const jsonData: MLBData[] = await response.json();
        
        // 2025년 데이터만 필터링
        const data2025 = jsonData.filter(d => d.년도 === 2025);
        setData(data2025);
        processChartData(jsonData, data2025);
      } else {
        console.error('데이터 로딩 실패:', response.status, response.statusText);
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 border-b-4 border-white shadow-lg">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="flex items-center space-x-2 bg-white/80 px-4 py-2 rounded-full hover:bg-white transition-all shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="w-5 h-5 text-purple-500" />
              <span className="hidden sm:inline font-semibold text-purple-700">돌아가기</span>
            </Link>
            <div className="h-8 w-px bg-purple-200" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              MLB 2025년 비용 분석 ✨
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 차트 */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 shadow-xl border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                    2025년 월별 비용 분석 📊
                  </h2>
                  <div className="text-xs text-purple-600 mt-2 flex items-center gap-1 font-medium">
                    <span className="inline-block w-2 h-2 bg-pink-400 rounded-full animate-pulse"></span>
                    막대를 클릭하면 월별 YOY를 확인할 수 있습니다
                  </div>
                </div>
              </div>

              {/* 선택된 월 정보 */}
              {selectedMonth !== null && chartData.find(d => d.monthNum === selectedMonth) && (
                <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 via-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-blue-900 flex items-center gap-2">
                        <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        2025년 {selectedMonth}월
                      </div>
                      <div className="text-xs text-blue-800 ml-3.5 font-medium">
                        총비용: <span className="text-blue-900 font-bold">{formatCurrency(chartData.find(d => d.monthNum === selectedMonth)?.total2025 || 0)}</span>
                      </div>
                      <div className="text-xs text-blue-700 ml-3.5">
                        전년: <span className="font-semibold">{formatCurrency(chartData.find(d => d.monthNum === selectedMonth)?.total2024 || 0)}</span>
                      </div>
                    </div>
                    <div className={`text-right px-4 py-2 rounded-lg ${
                      (chartData.find(d => d.monthNum === selectedMonth)?.yoy || 0) >= 0 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      <div className="text-xs font-medium opacity-75">YOY</div>
                      <div className="text-3xl font-black">
                        {formatYOY(chartData.find(d => d.monthNum === selectedMonth)?.yoy || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <ResponsiveContainer width="100%" height={500}>
                <ComposedChart 
                  data={chartData}
                  onClick={(data) => {
                    if (data && data.activePayload && data.activePayload[0]) {
                      const monthNum = data.activePayload[0].payload.monthNum;
                      setSelectedMonth(monthNum === selectedMonth ? null : monthNum);
                    }
                  }}
                  margin={{ top: 30, right: 50, left: 10, bottom: 10 }}
                >
                  <defs>
                    {/* 그리드 배경 그라데이션 */}
                    <linearGradient id="gridGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f1f5f9" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#f8fafc" stopOpacity={0.2}/>
                    </linearGradient>
                    
                    {/* 각 카테고리별 그라데이션 정의 */}
                    {categoryStats.map((category) => {
                      const gradientId = `gradient-${category.name.replace(/[^a-zA-Z0-9]/g, '')}`;
                      const baseColor = category.color;
                      return (
                        <linearGradient key={gradientId} id={gradientId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={baseColor} stopOpacity={1}/>
                          <stop offset="100%" stopColor={baseColor} stopOpacity={0.8}/>
                        </linearGradient>
                      );
                    })}
                    
                    {/* 호버 효과를 위한 필터 */}
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                      <feOffset dx="0" dy="2" result="offsetblur"/>
                      <feComponentTransfer>
                        <feFuncA type="linear" slope="0.3"/>
                      </feComponentTransfer>
                      <feMerge>
                        <feMergeNode/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#e0b0ff" 
                    strokeOpacity={0.2}
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="month" 
                    stroke="#94a3b8"
                    style={{ 
                      fontSize: '13px',
                      fontWeight: '600',
                      fill: '#64748b'
                    }}
                    axisLine={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#64748b"
                    style={{ 
                      fontSize: '12px',
                      fontWeight: '500',
                      fill: '#64748b'
                    }}
                    tickFormatter={formatCurrency}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: '비용 (천위안)', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: '12px' } }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#ef4444"
                    style={{ 
                      fontSize: '12px',
                      fontWeight: '500',
                      fill: '#ef4444'
                    }}
                    tickFormatter={(value) => `${value}%`}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 150]}
                    label={{ value: 'YOY (%)', angle: 90, position: 'insideRight', style: { fill: '#ef4444', fontSize: '12px' } }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      border: '3px solid',
                      borderImage: 'linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6) 1',
                      borderRadius: '16px',
                      fontSize: '13px',
                      boxShadow: '0 20px 60px rgba(147, 51, 234, 0.25)',
                      padding: '14px 18px',
                      fontWeight: '600'
                    }}
                    formatter={(value: any, name: string) => {
                      return [formatCurrency(value), name];
                    }}
                    cursor={{ fill: 'rgba(236, 72, 153, 0.1)', radius: 10 }}
                    wrapperStyle={{ outline: 'none' }}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      fontSize: '12px',
                      fontWeight: '600',
                      paddingTop: '20px'
                    }}
                    iconType="circle"
                    iconSize={10}
                  />

                  {/* 100% 기준선 */}
                  <ReferenceLine 
                    yAxisId="right" 
                    y={100} 
                    stroke="#94a3b8" 
                    strokeDasharray="5 5" 
                    strokeWidth={2}
                  />

                  {/* 대분류별 스택 바 */}
                  {categoryStats.map((category, index) => {
                    return (
                      <Bar
                        key={category.name}
                        dataKey={category.name}
                        stackId="cost"
                        fill={category.color}
                        yAxisId="left"
                        cursor="pointer"
                        radius={index === categoryStats.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]}
                        animationDuration={800}
                        animationBegin={index * 50}
                      />
                    );
                  })}

                  {/* YOY 라인 */}
                  <Line
                    type="monotone"
                    dataKey="yoy"
                    stroke="#ef4444"
                    strokeWidth={3}
                    yAxisId="right"
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 5, stroke: '#fff' }}
                    activeDot={{ r: 7, fill: '#ef4444', stroke: '#fff', strokeWidth: 3 }}
                    name="YOY"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 오른쪽: 카테고리별 비율 */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 shadow-xl border border-slate-100">
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-5">
                카테고리별 비율 🎯
              </h3>
              
              <div className="space-y-2">
                {categoryStats.map((category) => {
                  const percentage = (category.total / totalCost) * 100;
                  const isExpanded = expandedCategories.has(category.name);

                  return (
                    <div key={category.name} className="border border-slate-200/50 rounded-xl overflow-hidden hover:shadow-md transition-all duration-200 bg-white">
                      {/* 카테고리 헤더 */}
                      <button
                        onClick={() => toggleCategory(category.name)}
                        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent transition-all duration-200"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <div 
                            className="w-4 h-4 rounded-lg flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: category.color }}
                          />
                          <div className="text-left flex-1 min-w-0">
                            <div className="text-sm font-bold text-slate-800 truncate">
                              {category.name}
                            </div>
                            <div className="text-xs text-slate-600 font-medium mt-0.5">
                              {formatCurrency(category.total)} <span className="text-slate-400">({percentage.toFixed(1)}%)</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                            category.yoy >= 0 
                              ? 'bg-green-50 text-green-600' 
                              : 'bg-red-50 text-red-600'
                          }`}>
                            {formatYOY(category.yoy)}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          )}
                        </div>
                      </button>

                      {/* YOY 토글 영역 */}
                      {isExpanded && (
                        <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-transparent border-t border-slate-100">
                          <div className="text-xs text-slate-600 mb-2 font-medium">전년 대비 증감률 상세</div>
                          <div className="flex items-baseline gap-2">
                            <div className={`text-2xl font-black ${
                              category.yoy >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatYOY(category.yoy)}
                            </div>
                            <div className="text-xs text-slate-500 font-medium">
                              {category.yoy >= 0 ? '↑ 증가' : '↓ 감소'}
                            </div>
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

