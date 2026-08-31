import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AuthScreen } from '@/components/AuthScreen';
import { AppShell, type PageId } from '@/components/AppShell';
import { FullPageLoader } from '@/components/ui';
import { FarmerDashboard } from '@/pages/farmer/FarmerDashboard';
import { AnimalsPage } from '@/pages/farmer/AnimalsPage';
import { ReportSymptomPage } from '@/pages/farmer/ReportSymptomPage';
import { VetDashboard } from '@/pages/vet/VetDashboard';
import { DistrictDashboard } from '@/pages/district/DistrictDashboard';
import { RiskMapPage } from '@/pages/shared/RiskMapPage';
import { AdvisoriesPage } from '@/pages/shared/AdvisoriesPage';

function AppContent() {
  const { session, profile, loading } = useAuth();
  const [page, setPage] = useState<PageId>('dashboard');

  if (loading) return <FullPageLoader />;
  if (!session || !profile) return <AuthScreen />;

  const role = profile.role;
  const isVet = role === 'vet_official';
  const isDistrict = role === 'district_official';

  const renderPage = () => {
    if (isDistrict) {
      switch (page) {
        case 'dashboard':
        case 'surveillance':
          return <DistrictDashboard />;
        case 'map':
          return <RiskMapPage />;
        case 'broadcast':
          return <DistrictDashboard />;
        case 'advisories':
          return <AdvisoriesPage />;
        default:
          return <DistrictDashboard />;
      }
    }
    if (isVet) {
      switch (page) {
        case 'dashboard':
        case 'cases':
          return <VetDashboard />;
        case 'map':
          return <RiskMapPage />;
        case 'advisories':
          return <AdvisoriesPage />;
        default:
          return <VetDashboard />;
      }
    }
    switch (page) {
      case 'dashboard':
        return <FarmerDashboard onNavigate={setPage} />;
      case 'animals':
        return <AnimalsPage />;
      case 'report':
        return <ReportSymptomPage onNavigate={setPage} />;
      case 'map':
        return <RiskMapPage />;
      case 'advisories':
        return <AdvisoriesPage />;
      default:
        return <FarmerDashboard onNavigate={setPage} />;
    }
  };

  return (
    <AppShell current={page} onNavigate={setPage}>
      {renderPage()}
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
