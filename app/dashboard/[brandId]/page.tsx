import BrandDashboard from '@/components/BrandDashboard';

export default function DashboardPage({
  params,
}: {
  params: { brandId: string };
}) {
  return <BrandDashboard brandId={params.brandId} />;
}

export function generateStaticParams() {
  return [
    { brandId: 'mlb' },
    { brandId: 'mlb-kids' },
    { brandId: 'discovery' },
    { brandId: 'common' },
  ];
}

