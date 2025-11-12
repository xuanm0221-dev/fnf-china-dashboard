import BrandDashboard from '@/components/BrandDashboard';

export default function DashboardPage({
  params,
  searchParams,
}: {
  params: { brandId: string };
  searchParams: { month?: string };
}) {
  return <BrandDashboard brandId={params.brandId} initialMonth={searchParams.month} />;
}

export function generateStaticParams() {
  return [
    { brandId: 'mlb' },
    { brandId: 'mlb-kids' },
    { brandId: 'discovery' },
    { brandId: 'common' },
  ];
}

