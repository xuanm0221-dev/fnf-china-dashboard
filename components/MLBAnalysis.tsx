'use client';

import { useState, useEffect } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
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

// 대분류별 색상 매핑 (이미지와 유사하게)
const CATEGORY_COLORS: { [key: string]: string } = {
  '인건비': '#5470c6',          // 파란색
  '복리후생비': '#91cc75',      // 연두색
  '출장비': '#fac858',          // 노란색
  '광고비': '#ee6666',          // 빨간색
  '감가상각비': '#73c0de',      // 하늘색
  '지급수수료': '#3ba272',      // 초록색
  '기타': '#9a60b4',            // 보라색
  '수주회': '#ea7ccc',          // 핑크색
  '임차료': '#fc8452',          // 주황색
};

export default function MLBAnalysis() {
  const [data, setData] = useState<MLBData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/data/mlb_china_data.json');
      if (response.ok) {
        const jsonData: MLBData[] = await response.json();
        setData(jsonData);
        processChartData(jsonData);
      }
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
    }
    setLoading(false);
  };

  const processChartData = (rawData: MLBData[]) => {
    // 월별, 대분류별로 집계
    const monthlyData: { [key: string]: any } = {};
    const categorySet = new Set<string>();

    rawData.forEach(item => {
      const month = item.연월;
      const category = item.대분류;
      
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month: month.substring(5), // MM만
          연월: month,
          년도: item.년도,
          total: 0,
        };
      }

      if (!monthlyData[month][category]) {
        monthlyData[month][category] = 0;
      }

      monthlyData[month][category] += item.금액;
      monthlyData[month].total += item.금액;
      categorySet.add(category);
    });

    // 월별로 정렬
    const sortedMonths = Object.keys(monthlyData).sort();
    const chartArray = sortedMonths.map(month => monthlyData[month]);

    // YOY 계산 (전년 동월 대비)
    chartArray.forEach((item, index) => {
      const currentYear = item.년도;
      const currentMonth = parseInt(item.month);
      
      // 전년 동월 찾기
      const prevYearData = chartArray.find(d => 
        d.년도 === currentYear - 1 && parseInt(d.month) === currentMonth
      );

      if (prevYearData && prevYearData.total > 0) {
        item.YOY = ((item.total - prevYearData.total) / prevYearData.total) * 100;
      } else {
        item.YOY = null;
      }
    });

    setChartData(chartArray);
    setCategories(Array.from(categorySet).sort());
  };

  const formatCurrency = (value: number) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억`;
    } else if (value >= 10000) {
      return `${(value / 10000).toFixed(0)}만`;
    }
    return value.toLocaleString();
  };

  const formatYOY = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // 통계 계산
  const totalCost = data.reduce((sum, item) => sum + item.금액, 0);
  const avgMonthlyCost = chartData.length > 0 ? totalCost / chartData.length : 0;
  const latestYOY = chartData.length > 0 && chartData[chartData.length - 1].YOY !== null 
    ? chartData[chartData.length - 1].YOY 
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
              MLB 중국본사 영업비 분석
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
            <div className="text-sm text-slate-600 mb-1">총 비용</div>
            <div className="text-2xl md:text-3xl font-bold text-slate-800">
              {formatCurrency(totalCost)}원
            </div>
            <div className="text-xs text-slate-500 mt-1">2024.01 ~ 2025.10</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
            <div className="text-sm text-slate-600 mb-1">월 평균 비용</div>
            <div className="text-2xl md:text-3xl font-bold text-slate-800">
              {formatCurrency(avgMonthlyCost)}원
            </div>
            <div className="text-xs text-slate-500 mt-1">22개월 평균</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
            <div className="text-sm text-slate-600 mb-1">최근 YOY 증감률</div>
            <div className={`text-2xl md:text-3xl font-bold flex items-center ${
              latestYOY >= 0 ? 'text-red-600' : 'text-blue-600'
            }`}>
              {latestYOY >= 0 ? (
                <TrendingUp className="w-6 h-6 mr-2" />
              ) : (
                <TrendingDown className="w-6 h-6 mr-2" />
              )}
              {formatYOY(latestYOY)}
            </div>
            <div className="text-xs text-slate-500 mt-1">전년 동월 대비</div>
          </div>
        </div>

        {/* 월별 비용 추이 및 YOY 비교 */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-md border border-slate-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold text-slate-800">
              월별 비용 추이 및 YOY 비교
            </h2>
            <div className="text-sm text-slate-600">
              단위: 원
            </div>
          </div>

          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                yAxisId="left"
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                tickFormatter={formatCurrency}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#ef4444"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${value.toFixed(0)}%`}
                domain={[-20, 20]}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'YOY') {
                    return [formatYOY(value), 'YOY 증감률'];
                  }
                  return [formatCurrency(value) + '원', name];
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                iconType="rect"
              />

              {/* 대분류별 스택 바 */}
              {categories.map((category, index) => (
                <Bar
                  key={category}
                  yAxisId="left"
                  dataKey={category}
                  stackId="cost"
                  fill={CATEGORY_COLORS[category] || '#94a3b8'}
                  radius={index === categories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}

              {/* YOY 라인 */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="YOY"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 4 }}
                connectNulls
                name="YOY"
              />
            </ComposedChart>
          </ResponsiveContainer>

          {/* 범례 설명 */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="text-xs text-slate-600 mb-2">대분류 항목:</div>
            <div className="flex flex-wrap gap-3">
              {categories.map(category => (
                <div key={category} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: CATEGORY_COLORS[category] || '#94a3b8' }}
                  />
                  <span className="text-xs text-slate-700">{category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 대분류별 통계 테이블 */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-md border border-slate-200">
          <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-4">
            대분류별 비용 통계
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">대분류</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">총 비용</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">비율</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">건수</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(category => {
                  const categoryTotal = data
                    .filter(d => d.대분류 === category)
                    .reduce((sum, d) => sum + d.금액, 0);
                  const categoryCount = data.filter(d => d.대분류 === category).length;
                  const ratio = (categoryTotal / totalCost) * 100;

                  return (
                    <tr key={category} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: CATEGORY_COLORS[category] || '#94a3b8' }}
                          />
                          <span className="font-medium text-slate-800">{category}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-slate-700">
                        {formatCurrency(categoryTotal)}원
                      </td>
                      <td className="text-right py-3 px-4 text-slate-600">
                        {ratio.toFixed(1)}%
                      </td>
                      <td className="text-right py-3 px-4 text-slate-600">
                        {categoryCount.toLocaleString()}건
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 font-bold">
                  <td className="py-3 px-4 text-slate-800">합계</td>
                  <td className="text-right py-3 px-4 text-slate-800">
                    {formatCurrency(totalCost)}원
                  </td>
                  <td className="text-right py-3 px-4 text-slate-800">100.0%</td>
                  <td className="text-right py-3 px-4 text-slate-800">
                    {data.length.toLocaleString()}건
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}


