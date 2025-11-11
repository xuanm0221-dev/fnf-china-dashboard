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
} from 'recharts';
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface CostData {
  브랜드: string;
  본부: string;
  팀: string;
  계정과목: string;
  금액: number;
  연월: string;
}

const COLORS = [
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#f97316',
  '#06b6d4',
  '#84cc16',
];

const BRAND_NAMES: { [key: string]: string } = {
  'mlb': 'MLB',
  'mlb-kids': 'MLB Kids',
  'discovery': 'Discovery',
  'common': '공통',
};

export default function BrandDashboard({ brandId }: { brandId: string }) {
  const [allData, setAllData] = useState<CostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  const brandName = BRAND_NAMES[brandId] || brandId;

  useEffect(() => {
    loadData();
  }, [brandId]);

  const loadData = async () => {
    setLoading(true);
    
    try {
      // JSON 파일에서 데이터 로드
      const response = await fetch('/data/cost_data.json');
      
      if (response.ok) {
        const jsonData = await response.json();
        const brandData = jsonData[brandId] || [];
        setAllData(brandData);
        
        // 사용 가능한 월 추출
        const months = Array.from(
          new Set(brandData.map((d: CostData) => d.연월))
        ).sort();
        setAvailableMonths(months);
      } else {
        console.error('Failed to load cost data');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    
    setLoading(false);
  };

  // 필터링된 데이터
  const filteredData = allData.filter((row) => {
    if (selectedMonth !== 'all' && row.연월 !== selectedMonth) return false;
    if (selectedDepartment !== 'all' && row.본부 !== selectedDepartment) return false;
    if (selectedTeam !== 'all' && row.팀 !== selectedTeam) return false;
    return true;
  });

  // 통계 계산
  const totalCost = filteredData.reduce((sum, row) => sum + row.금액, 0);
  const uniqueMonths = Array.from(new Set(filteredData.map((d) => d.연월)));
  const avgMonthlyCost = uniqueMonths.length > 0 ? totalCost / uniqueMonths.length : 0;

  // 월별 데이터
  const monthlyData = availableMonths.map((month) => {
    const monthCost = allData
      .filter((d) => d.연월 === month)
      .reduce((sum, row) => sum + row.금액, 0);
    return {
      month: month.substring(5), // YYYY-MM에서 MM만
      총비용: monthCost,
    };
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

  // 고유 값들
  const departments = Array.from(new Set(allData.map((d) => d.본부))).filter(d => d && d !== 'nan');
  const teams = Array.from(
    new Set(
      allData
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(Math.abs(value)) + ' 원';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="text-white text-xl">데이터 로딩 중...</div>
        </div>
      </div>
    );
  }

  if (allData.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">데이터가 없습니다</div>
          <Link href="/" className="text-purple-400 hover:text-purple-300">
            ← 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">돌아가기</span>
              </Link>
              <div className="h-6 w-px bg-slate-700" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                {brandName} 비용 대시보드
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* 필터 섹션 */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700 mb-6">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4">필터</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                월 선택
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">전체</option>
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                본부 선택
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  setSelectedTeam('all');
                }}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">전체</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                팀 선택
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={selectedDepartment === 'all'}
              >
                <option value="all">전체</option>
                {teams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-4 md:p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-purple-100">총 비용</h3>
              <DollarSign className="w-5 h-5 text-purple-200" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-white">
              {formatCurrency(totalCost)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-4 md:p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-blue-100">평균 월 비용</h3>
              <Calendar className="w-5 h-5 text-blue-200" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-white">
              {formatCurrency(avgMonthlyCost)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-4 md:p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-green-100">최고 비용 월</h3>
              <TrendingUp className="w-5 h-5 text-green-200" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-white">
              {monthlyData.length > 0
                ? monthlyData.reduce((max, d) => (d.총비용 > max.총비용 ? d : max)).month
                : '-'}
            </p>
          </div>

          <div
            className={`bg-gradient-to-br ${
              changeRate >= 0 ? 'from-orange-600 to-orange-800' : 'from-teal-600 to-teal-800'
            } rounded-xl p-4 md:p-6 shadow-lg`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-white/90">비용 증감률</h3>
              {changeRate >= 0 ? (
                <TrendingUp className="w-5 h-5 text-white/80" />
              ) : (
                <TrendingDown className="w-5 h-5 text-white/80" />
              )}
            </div>
            <p className="text-xl md:text-2xl font-bold text-white">
              {changeRate >= 0 ? '+' : ''}
              {changeRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* 그래프 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 월별 비용 추이 */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700">
            <h2 className="text-lg md:text-xl font-bold text-white mb-4">월별 비용 추이</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="총비용"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 본부별 비용 비교 */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700">
            <h2 className="text-lg md:text-xl font-bold text-white mb-4">본부별 비용 비교 (Top 10)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="본부" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="비용" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 계정과목별 비용 분포 */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700">
            <h2 className="text-lg md:text-xl font-bold text-white mb-4">
              계정과목별 비용 분포 (Top 8)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={accountData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {accountData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 팀별 비용 순위 */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700">
            <h2 className="text-lg md:text-xl font-bold text-white mb-4">
              팀별 비용 순위 (Top 10)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="팀" type="category" stroke="#94a3b8" width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="비용" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
