// src/pages/PlaqueDetailPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components';
import { PlaqueDetail } from '@/components/plaques/PlaqueDetail';
import { adaptPlaquesData } from '@/utils/plaqueAdapter';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { useFavorites } from '@/hooks/useFavorites';
import { Plaque } from '@/types/plaque';
import { toast } from 'sonner';

const PlaqueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State
  const [plaque, setPlaque] = useState<Plaque | null>(null);
  const [nearbyPlaques, setNearbyPlaques] = useState<Plaque[]>([]);
  const [loading, setLoading] = useState(true);
  const [allPlaques, setAllPlaques] = useState<Plaque[]>([]);
  
  // Hooks
  const { isPlaqueVisited, markAsVisited } = useVisitedPlaques();
  const { isFavorite, toggleFavorite } = useFavorites();

  // Load plaque data
  useEffect(() => {
    const loadPlaqueData = async () => {
      if (!id) {
        navigate('/discover');
        return;
      }

      try {
        setLoading(true);
        
        // Import plaque data
        const { default: plaqueData } = await import('@/data/plaque_data.json');
        const adaptedData = adaptPlaquesData(plaqueData);
        setAllPlaques(adaptedData);
        
        // Find the specific plaque
        const plaqueId = parseInt(id);
        const foundPlaque = adaptedData.find(p => p.id === plaqueId);
        
        if (!foundPlaque) {
          toast.error('Plaque not found');
          navigate('/discover');
          return;
        }
        
        // Set plaque with visited status
        const plaqueWithStatus = {
          ...foundPlaque,
          visited: foundPlaque.visited || isPlaqueVisited(foundPlaque.id)
        };
        
        setPlaque(plaqueWithStatus);
        
        // Find nearby plaques (same area or profession)
        const nearby = adaptedData
          .filter(p => 
            p.id !== plaqueId && 
            (
              (p.postcode === foundPlaque.postcode) ||
              (p.profession === foundPlaque.profession && foundPlaque.profession) ||
              (p.area === foundPlaque.area && foundPlaque.area)
            )
          )
          .slice(0, 6);
        
        setNearbyPlaques(nearby);
        
      } catch (error) {
        console.error('Error loading plaque data:', error);
        toast.error('Failed to load plaque data');
        navigate('/discover');
      } finally {
        setLoading(false);
      }
    };

    loadPlaqueData();
  }, [id, navigate, isPlaqueVisited]);

  // Handlers
  const handleFavoriteToggle = useCallback((plaqueId: number) => {
    toggleFavorite(plaqueId);
  }, [toggleFavorite]);

  const handleMarkVisited = useCallback(async (plaqueId: number) => {
    try {
      await markAsVisited(plaqueId, {
        visitedAt: new Date().toISOString(),
        notes: '',
      });
      
      // Update local plaque state
      if (plaque && plaque.id === plaqueId) {
        setPlaque(prev => prev ? { ...prev, visited: true } : null);
      }
      
      toast.success("Marked as visited");
    } catch (error) {
      console.error("Error marking as visited:", error);
      toast.error("Failed to mark as visited");
    }
  }, [markAsVisited, plaque]);

  const handleSelectNearbyPlaque = useCallback((nearbyPlaque: Plaque) => {
    navigate(`/plaque/${nearbyPlaque.id}`);
  }, [navigate]);

  const handleClose = useCallback(() => {
    // Go back to previous page or discover if no history
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/discover');
    }
  }, [navigate]);

  // SEO and meta data
  useEffect(() => {
    if (plaque) {
      // Update page title and meta description
      document.title = `${plaque.title} | My Plaquer App`;
      
      // Add meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 
          `Discover the ${plaque.title} plaque in ${plaque.location || plaque.area}. ${plaque.inscription ? plaque.inscription.substring(0, 120) + '...' : ''}`
        );
      }
      
      // Add Open Graph meta tags for social sharing
      const addMetaTag = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };
      
      addMetaTag('og:title', plaque.title);
      addMetaTag('og:description', plaque.inscription || `A historical plaque in ${plaque.location || plaque.area}`);
      addMetaTag('og:url', window.location.href);
      addMetaTag('og:type', 'website');
      
      if (plaque.image) {
        addMetaTag('og:image', plaque.image);
      }
    }
    
    // Cleanup on unmount
    return () => {
      document.title = 'My Plaquer App';
    };
  }, [plaque]);

  // Loading state
  if (loading) {
    return (
      <PageContainer activePage="discover" hasFooter={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading plaque details...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Not found state (shouldn't reach here due to navigation in useEffect)
  if (!plaque) {
    return (
      <PageContainer activePage="discover" hasFooter={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Plaque Not Found</h1>
            <p className="text-gray-600 mb-6">The plaque you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/discover')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Browse All Plaques
            </button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer activePage="discover" hasFooter={false}>
      <PlaqueDetail
        plaque={plaque}
        isOpen={true}
        onClose={handleClose}
        isFavorite={isFavorite(plaque.id)}
        onFavoriteToggle={handleFavoriteToggle}
        onMarkVisited={handleMarkVisited}
        nearbyPlaques={nearbyPlaques}
        onSelectNearbyPlaque={handleSelectNearbyPlaque}
        className="z-50"
        isMapView={false}
        isFullPage={true}
      />
    </PageContainer>
  );
};

export default PlaqueDetailPage;