'use client';

import Link from 'next/link';
import { TrendingUp, ShoppingBag, Compass, Users, Calendar } from 'lucide-react';
import { useState } from 'react';

const brands = [
  {
    id: 'mlb',
    name: 'MLB',
    icon: 'M',
    color: 'from-blue-600 to-blue-800',
    bgColor: 'bg-blue-600',
    borderColor: 'border-blue-500',
    stats: {
      totalCost: 245680000,
      employees: 136,
      revenue: 349400000,
      yoyGrowth: 6.6,
    },
  },
  {
    id: 'mlb-kids',
    name: 'MLB KIDS',
    icon: 'MK',
    color: 'from-pink-600 to-pink-800',
    bgColor: 'bg-pink-600',
    borderColor: 'border-pink-500',
    stats: {
      totalCost: 89500000,
      employees: 53,
      revenue: 79520000,
      yoyGrowth: 8.0,
    },
  },
  {
    id: 'discovery',
    name: 'DISCOVERY',
    icon: 'DX',
    color: 'from-green-600 to-green-800',
    bgColor: 'bg-green-600',
    borderColor: 'border-green-500',
    stats: {
      totalCost: 178900000,
      employees: 118,
      revenue: 403360000,
      yoyGrowth: 4.0,
    },
  },
  {
    id: 'common',
    name: '공통',
    icon: '공통',
    color: 'from-purple-600 to-purple-800',
    bgColor: 'bg-purple-600',
    borderColor: 'border-purple-500',
    stats: {
      totalCost: 456780000,
      employees: 89,
      revenue: 0,
      yoyGrowth: 3.2,
    },
  },
];

export default function Home() {
  const [selectedPeriod, setSelectedPeriod] = useState('2025년 10월');
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);

  const formatNumber = (num: number) => {
    if (num >= 100000000) {
      return `${(num / 100000000).toFixed(0)}억원`;
    } else if (num >= 10000) {
      return `${(num / 10000).toFixed(0)}만원`;
    }
    return `${num.toLocaleString()}원`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                에프앤에프 차이나 비용 분석 대시보드
              </h1>
            </div>
            <div className="flex items-center space-x-2 bg-slate-100 px-4 py-2 rounded-lg">
              <Calendar className="w-5 h-5 text-slate-600" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
              >
                <option>2025년 10월</option>
                <option>2025년 9월</option>
                <option>2025년 8월</option>
                <option>2024년 전체</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* 브랜드 선택 섹션 */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-2">브랜드 선택</h2>
          <p className="text-slate-600 text-sm">분석할 브랜드를 클릭하여 상세 대시보드로 이동합니다</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 hover:border-slate-300 transition-all duration-300 overflow-hidden"
            >
              {/* 브랜드 헤더 */}
              <div className={`bg-gradient-to-r ${brand.color} p-6 text-white`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${brand.bgColor} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                    {brand.icon}
                  </div>
                  <div className="text-right">
                    <div className="text-xs opacity-80">매출액YOY</div>
                    <div className="text-lg font-bold">
                      {brand.stats.yoyGrowth > 0 ? '+' : ''}
                      {brand.stats.yoyGrowth}%
                    </div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold">{brand.name}</h3>
              </div>

              {/* 통계 정보 */}
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-xs text-slate-500 mb-1">총비용</div>
                    <div className="text-sm font-bold text-slate-800">
                      {formatNumber(brand.stats.totalCost)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500 mb-1">인원수</div>
                    <div className="text-sm font-bold text-slate-800">
                      {brand.stats.employees}명
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500 mb-1">실판매출액</div>
                    <div className="text-sm font-bold text-slate-800">
                      {brand.stats.revenue > 0 ? formatNumber(brand.stats.revenue) : '-'}
                    </div>
                  </div>
                </div>

                {/* 영업비 상세보기 */}
                <button
                  onClick={() => setExpandedBrand(expandedBrand === brand.id ? null : brand.id)}
                  className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-700 font-medium transition-colors mb-3 flex items-center justify-between"
                >
                  <span>영업비 상세보기</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${expandedBrand === brand.id ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedBrand === brand.id && (
                  <div className="mb-3 p-3 bg-slate-50 rounded-lg text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">인건비</span>
                      <span className="font-semibold text-slate-800">{formatNumber(brand.stats.totalCost * 0.6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">광고선전비</span>
                      <span className="font-semibold text-slate-800">{formatNumber(brand.stats.totalCost * 0.2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">기타영업비</span>
                      <span className="font-semibold text-slate-800">{formatNumber(brand.stats.totalCost * 0.2)}</span>
                    </div>
                  </div>
                )}

                {/* 전체 대시보드 보기 버튼 */}
                <Link href={`/dashboard/${brand.id}`}>
                  <button className={`w-full py-3 px-4 bg-gradient-to-r ${brand.color} text-white font-bold rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105`}>
                    전체 대시보드 보기
                  </button>
                </Link>
              </div>

              {/* YOY 증감률 표시 */}
              <div className={`px-6 pb-4 flex items-center justify-center space-x-2 text-sm ${brand.stats.yoyGrowth >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                <span className="font-medium">영업비율</span>
                <span className="font-bold">
                  {brand.stats.yoyGrowth >= 0 ? '↑' : '↓'} {Math.abs(brand.stats.yoyGrowth)}%
                </span>
                <span className="text-slate-500">전년비</span>
              </div>
            </div>
          ))}
        </div>

        {/* 하단 정보 섹션 */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">월별 비용 추이</h3>
            </div>
            <p className="text-slate-600 text-sm">
              시간에 따른 비용 변화를 분석하고 트렌드를 파악합니다
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">부서별 비교</h3>
            </div>
            <p className="text-slate-600 text-sm">
              본부 및 팀별 비용을 비교하고 효율성을 분석합니다
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Compass className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">계정과목 분석</h3>
            </div>
            <p className="text-slate-600 text-sm">
              비용 항목별 분포를 확인하고 최적화 포인트를 찾습니다
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-slate-600 text-sm">
          <p>에프앤에프 차이나 비용 분석 대시보드 © 2024-2025</p>
          <p className="mt-1 text-xs text-slate-500">실시간 데이터 기반 의사결정 지원 시스템</p>
        </div>
      </footer>
    </div>
  );
}
