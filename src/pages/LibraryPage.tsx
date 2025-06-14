// src/pages/LibraryPage.tsx
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, TrendingUp } from 'lucide-react';
import { PageContainer } from '@/components';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCollections } from '@/hooks/useCollection';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { useRoutes } from '@/hooks/useRoutes';
import LibraryHeader from '@/components/library/LibraryHeader';
import LibraryStats from '@/components/library/LibraryStats';
import CollectionsSection from '@/components/library/CollectionsSection';
import RoutesSection from '@/components/library/RoutesSection';
import VisitsSection from '@/components/library/VisitsSection';

const LibraryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { collections, loading: collectionsLoading } = useCollections();
  const { visits, loading: visitsLoading } = useVisitedPlaques();
  const { routes, loading: routesLoading } = useRoutes();

  // Calculate stats
  const totalCollections = collections.length;
  const totalRoutes = routes.length;
  const totalVisits = visits.length;
  const uniquePlaquesVisited = new Set(visits.map((v) => v.plaque_id)).size;
  const totalPlaquesInCollections = collections.reduce(
    (sum, c) => sum + (Array.isArray(c.plaques) ? c.plaques.length : 0),
    0
  );
  const totalRouteDistance = routes.reduce(
    (sum, r) => sum + r.total_distance,
    0
  );

  if (!user) {
    return (
      <PageContainer activePage="library" simplifiedFooter={true}>
        <div className="container mx-auto py-8 px-4 text-center">
          <div className="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto">
            <BookOpen className="mx-auto text-gray-300 mb-4" size={48} />
            <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
            <p className="text-gray-600 mb-6">
              You need to sign in to access your library.
            </p>
            <Button onClick={() => navigate('/')}>Back to Home</Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  const isLoading = collectionsLoading || visitsLoading || routesLoading;

  return (
    <PageContainer activePage="library" simplifiedFooter={true}>
      <LibraryHeader
        user={user}
        totalCollections={totalCollections}
        totalRoutes={totalRoutes}
        totalVisits={totalVisits}
      />

      <div className="container mx-auto max-w-6xl px-4">
        {/* Stats Overview */}
        <LibraryStats
          totalCollections={totalCollections}
          totalRoutes={totalRoutes}
          totalVisits={totalVisits}
          uniquePlaquesVisited={uniquePlaquesVisited}
          totalPlaquesInCollections={totalPlaquesInCollections}
          totalRouteDistance={totalRouteDistance}
          className="-mt-5 mb-6 relative z-10"
        />

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500">Loading your library...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Collections Section */}
            <CollectionsSection
              collections={collections}
              onViewAll={() => navigate('/library/collections')}
              onCreateNew={() => navigate('/library/collections')}
            />

            {/* Routes Section */}
            <RoutesSection
              routes={routes}
              onViewAll={() => navigate('/library/routes')}
              onCreateNew={() => navigate('/discover?view=map')}
            />

            {/* Visits Section */}
            <VisitsSection
              visits={visits}
              onViewAll={() => navigate('/library/visits')}
              onExploreMore={() => navigate('/discover')}
            />

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="text-blue-500" size={20} />
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => navigate('/library/collections')}
                  className="h-16 bg-purple-600 hover:bg-purple-700 flex flex-col items-center justify-center"
                >
                  <Plus size={20} className="mb-1" />
                  Create Collection
                </Button>
                <Button
                  onClick={() => navigate('/discover?view=map')}
                  className="h-16 bg-green-600 hover:bg-green-700 flex flex-col items-center justify-center"
                >
                  <Plus size={20} className="mb-1" />
                  Plan Route
                </Button>
                <Button
                  onClick={() => navigate('/discover')}
                  className="h-16 bg-blue-600 hover:bg-blue-700 flex flex-col items-center justify-center"
                >
                  <Plus size={20} className="mb-1" />
                  Explore Plaques
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default LibraryPage;
