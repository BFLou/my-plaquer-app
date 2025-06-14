// src/pages/Home.tsx - Mobile-optimized with touch-friendly components
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Map,
  Navigation,
  Info,
  CheckCircle,
  Filter as FilterIcon,
  MapPin,
} from 'lucide-react';
import { PageContainer } from '@/components';
import { MobileButton } from '@/components/ui/mobile-button';
import { MobileDialog } from '@/components/ui/mobile-dialog';
import { FloatingActionButton } from '@/components/layout/FloatingActionButton';
import { toast } from 'sonner';
import {
  OnboardingStepContent,
  CategoriesSection,
} from '@/components/home/HomeComponents';
import EnhancedSearchBar from '@/components/home/EnhancedSearchBar';
import { usePlaqueCounts, getPlaqueCategories } from '@/utils/plaque-utils';
import EnhancedHowItWorks from '@/components/home/EnhancedHowItWorks';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';

// Famous historical figures data for the map
const famousPlaques = [
  {
    id: 730,
    name: 'Alan Turing',
    profession: 'Mathematician & Computer Scientist',
    lat: 51.5233,
    lng: -0.1849,
    location: '2 Warrington Crescent, Maida Vale',
  },
  {
    id: 487,
    name: 'Ada Lovelace',
    profession: 'Mathematician & Writer',
    lat: 51.5079,
    lng: -0.1364,
    location: "12 St James's Square",
  },
  {
    id: 656,
    name: 'Florence Nightingale',
    profession: 'Nurse & Statistician',
    lat: 51.5083,
    lng: -0.1502,
    location: '10 South Street, Mayfair',
  },
  {
    id: 302,
    name: 'Sir Isaac Newton',
    profession: 'Physicist & Mathematician',
    lat: 51.50806,
    lng: -0.13682,
    location: "87 Jermyn Street, St James's",
  },
  {
    id: 108,
    name: 'Charles Darwin',
    profession: 'Naturalist & Biologist',
    lat: 51.5245,
    lng: -0.1334,
    location: 'Biological Sciences Building, UCL',
  },
  {
    id: 352,
    name: 'Sir Winston Churchill',
    profession: 'Prime Minister & Statesman',
    lat: 51.50207,
    lng: -0.18019,
    location: '28 Hyde Park Gate, Kensington',
  },
  {
    id: 372,
    name: 'Charles Dickens',
    profession: 'Novelist',
    lat: 51.5223,
    lng: -0.1146,
    location: '48 Doughty Street, Holborn',
  },
  {
    id: 296,
    name: 'Karl Marx',
    profession: 'Philosopher & Economist',
    lat: 51.5137,
    lng: -0.1332,
    location: '28 Dean Street, Soho',
  },
];

// Enhanced Map Preview component with mobile optimizations
const EnhancedMapPreview = ({
  navigateToDiscover,
}: {
  navigateToDiscover: (path: string) => void;
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Initialize map with mobile-specific settings
  useEffect(() => {
    if (!window.L || !mapContainerRef.current) return;

    try {
      // Create mobile-optimized map
      const map = window.L.map(mapContainerRef.current, {
        center: [51.51, -0.14],
        zoom: isMobile() ? 12 : 13, // Slightly zoomed out on mobile
        zoomControl: false,
        dragging: !isMobile(), // Disable dragging on mobile to prevent scroll conflicts
        scrollWheelZoom: false,
        doubleClickZoom: false,
        attributionControl: true,
        touchZoom: true, // Enable touch zoom
        tapTolerance: 15, // Increase tap tolerance for mobile
      });

      // Use a styled map tile layer
      window.L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }
      ).addTo(map);

      // Create mobile-friendly tooltip
      const tooltipEl = document.createElement('div');
      tooltipEl.className = 'mobile-map-tooltip';
      tooltipEl.style.cssText = `
        display: none;
        position: absolute;
        z-index: 9999;
        background-color: #1f2937;
        color: white;
        padding: 12px;
        border-radius: 8px;
        min-width: 200px;
        max-width: 280px;
        text-align: center;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        pointer-events: none;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 14px;
        line-height: 1.4;
      `;

      if (mapContainerRef.current) {
        mapContainerRef.current.appendChild(tooltipEl);
      }

      // Add markers with mobile-optimized interaction
      famousPlaques.forEach((plaque) => {
        const icon = window.L.divIcon({
          className: 'mobile-plaque-marker',
          html: `
            <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 touch-target">
              <div class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                ${plaque.name.charAt(0)}
              </div>
            </div>
          `,
          iconSize: [40, 40], // Larger for mobile
          iconAnchor: [20, 20],
        });

        const marker = window.L.marker([plaque.lat, plaque.lng], {
          icon,
          interactive: true,
        }).addTo(map);

        // Mobile-optimized marker interaction
        let tooltipTimeout: NodeJS.Timeout;

        const showTooltip = (e: any) => {
          clearTimeout(tooltipTimeout);

          tooltipEl.innerHTML = `
            <div style="font-weight: 600; font-size: 15px; margin-bottom: 4px;">${plaque.name}</div>
            <div style="font-size: 13px; opacity: 0.9; margin-bottom: 6px;">${plaque.profession}</div>
            <div style="font-size: 12px; opacity: 0.8;">${plaque.location}</div>
          `;

          const point = map.latLngToContainerPoint(e.target.getLatLng());
          const tooltipWidth = 240;
          const tooltipHeight = 80;
          const mapWidth = mapContainerRef.current?.clientWidth || 300;
          const mapHeight = mapContainerRef.current?.clientHeight || 300;

          let top = point.y - tooltipHeight - 15;
          let left = point.x - tooltipWidth / 2;

          if (top < 10) top = point.y + 50;
          if (left < 10) left = 10;
          if (left + tooltipWidth > mapWidth - 10)
            left = mapWidth - tooltipWidth - 10;
          if (top + tooltipHeight > mapHeight - 70)
            top = mapHeight - tooltipHeight - 70;

          tooltipEl.style.left = `${left}px`;
          tooltipEl.style.top = `${top}px`;
          tooltipEl.style.display = 'block';
        };

        const hideTooltip = () => {
          tooltipTimeout = setTimeout(() => {
            tooltipEl.style.display = 'none';
          }, 100);
        };

        if (isMobile()) {
          // Mobile: Use tap events
          marker.on('click', showTooltip);

          // Hide tooltip after delay on mobile
          marker.on('click', () => {
            setTimeout(hideTooltip, 3000);
          });
        } else {
          // Desktop: Use hover events
          marker.on('mouseover', showTooltip);
          marker.on('mouseout', hideTooltip);
        }

        // Navigate on click/tap
        marker.on('click', (e: any) => {
          e.originalEvent.stopPropagation();
          triggerHapticFeedback('selection');
          showTooltip(e);
        });
      });

      setIsMapLoaded(true);

      return () => {
        if (map) {
          map.remove();
        }
        if (tooltipEl && tooltipEl.parentNode) {
          tooltipEl.parentNode.removeChild(tooltipEl);
        }
      };
    } catch (mapInitError) {
      console.error('Map initialization error:', mapInitError);
      setMapError(true);
    }
  }, [navigateToDiscover]);

  if (mapError) {
    return (
      <div className="relative w-full h-full rounded-xl overflow-hidden bg-blue-50 flex items-center justify-center">
        <div className="text-center p-6">
          <MapPin className="mx-auto text-blue-400 mb-2" size={32} />
          <p className="text-blue-600 text-sm font-medium">Interactive Map</p>
          <p className="text-blue-500 text-xs mt-1">Tap to explore plaques</p>
          <MobileButton
            onClick={() => navigateToDiscover('/discover?view=map')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
            touchOptimized
          >
            View Full Map
          </MobileButton>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      {/* Map container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full bg-gray-100 cursor-pointer touch-manipulation"
        style={{ minHeight: '280px' }}
        onClick={() => !isMobile() && navigateToDiscover('/discover?view=map')}
      />

      {/* Loading state */}
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-gray-500 text-sm">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  // Get dynamic plaque counts from plaque_data.json
  const { counts, loading } = usePlaqueCounts();

  // Get categories from the utility function
  const categories = useMemo(() => {
    return getPlaqueCategories(counts, navigate);
  }, [counts, navigate]);

  useEffect(() => {
    // Check if this is first visit to show onboarding
    const hasVisitedBefore = localStorage.getItem('hasSeen_homepage');
    if (!hasVisitedBefore) {
      setShowOnboarding(true);
      localStorage.setItem('hasSeen_homepage', 'true');
    }
  }, []);

  // Handle search submission with haptic feedback
  const handleSearch = (query: string) => {
    triggerHapticFeedback('light');
    if (query.trim()) {
      navigate(`/discover?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/discover');
    }
  };

  // Navigation to the discover page with map view
  const navigateToMapView = (path = '/discover?view=map') => {
    triggerHapticFeedback('selection');
    navigate(path);
  };

  // Handle near me button click with mobile optimization
  const handleNearMe = () => {
    triggerHapticFeedback('medium');

    if (navigator.geolocation) {
      const loadingToast = toast.loading('Finding your location...');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          toast.dismiss(loadingToast);
          triggerHapticFeedback('success');
          const { latitude, longitude } = position.coords;
          navigate(
            `/discover?view=map&lat=${latitude}&lng=${longitude}&zoom=15`
          );
        },
        (positionError) => {
          toast.dismiss(loadingToast);
          triggerHapticFeedback('error');
          toast.error(
            'Could not determine your location. Please allow location access.'
          );
          console.error('Geolocation error:', positionError);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    } else {
      triggerHapticFeedback('error');
      toast.error('Geolocation is not supported by your browser');
    }
  };

  // Onboarding steps content
  const onboardingSteps = [
    {
      title: 'Welcome to Plaquer',
      description:
        "Discover, track and collect London's iconic blue plaques marking historical sites across the city.",
      icon: <Info size={40} className="text-blue-500" />,
    },
    {
      title: 'Find Plaques',
      description:
        'Use our interactive map to locate blue plaques near you or search for specific historical figures.',
      icon: <Map size={40} className="text-blue-500" />,
    },
    {
      title: 'Build Your Collection',
      description:
        'Visit plaques in person, mark them as visited, and create themed collections of your favorites.',
      icon: <CheckCircle size={40} className="text-blue-500" />,
    },
  ];

  return (
    <PageContainer
      activePage="home"
      simplifiedFooter={false}
      hideNavBar={false}
      hideMobileNav={false}
      paddingBottom="mobile-nav"
    >
      {/* Hero Section - Mobile optimized */}
      <section className="relative py-12 md:py-20 px-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 md:w-40 h-32 md:h-40 rounded-full bg-white"></div>
          <div className="absolute bottom-10 right-20 w-48 md:w-60 h-48 md:h-60 rounded-full bg-white"></div>
          <div className="absolute top-32 right-32 w-16 md:w-20 h-16 md:h-20 rounded-full bg-white"></div>
        </div>

        <div className="container mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Left side with content */}
            <div className="w-full md:w-1/2 text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 leading-tight">
                Discover History Where You Stand
              </h1>
              <p className="text-base sm:text-lg md:text-xl mb-6 md:mb-8 opacity-90">
                Explore London's iconic blue plaques and build your personal
                collection of visited landmarks.
              </p>
              <MobileButton
                className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold shadow-lg text-base"
                onClick={() => {
                  triggerHapticFeedback('light');
                  navigate('/discover');
                }}
                touchOptimized
              >
                Start Exploring <ChevronRight size={18} className="ml-2" />
              </MobileButton>
            </div>

            {/* Right side with enhanced map */}
            <div className="w-full md:w-1/2 flex justify-center">
              <div className="relative w-80 h-80 sm:w-96 sm:h-80 md:w-96 md:h-80">
                <div className="absolute -inset-4 bg-blue-500 rounded-2xl rotate-6 transform"></div>
                <div className="absolute -inset-2 bg-blue-400 rounded-2xl -rotate-3 transform"></div>
                <div className="absolute inset-0 bg-white rounded-2xl shadow-xl overflow-hidden">
                  <EnhancedMapPreview navigateToDiscover={navigateToMapView} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Search Section - Mobile optimized */}
      <section className="py-6 px-4">
        <div className="container mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 -mt-8 md:-mt-12 relative z-20 max-w-4xl mx-auto">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 text-center">
              Find Plaques
            </h2>

            {/* Enhanced search bar */}
            <div className="mb-4">
              <EnhancedSearchBar onSearch={handleSearch} />
            </div>

            {/* Filter categories */}
            <div className="space-y-3">
              <div className="flex items-center">
                <FilterIcon size={14} className="text-gray-500 mr-2" />
                <h3 className="text-sm font-medium text-gray-700">
                  Explore by Topic
                </h3>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="h-12 bg-gray-100 animate-pulse rounded-lg"
                    ></div>
                  ))}
                </div>
              ) : (
                <CategoriesSection categories={categories} />
              )}
            </div>

            {/* Near me button - Touch optimized */}
            <div className="mt-4">
              <MobileButton
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-semibold"
                onClick={handleNearMe}
                touchOptimized
              >
                <Navigation size={18} className="mr-2" />
                Find Plaques Near Me
              </MobileButton>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced How It Works Component */}
      <EnhancedHowItWorks
        onStartJourney={() => {
          triggerHapticFeedback('light');
          navigate('/discover');
        }}
      />

      {/* Floating Action Button for mobile */}
      <FloatingActionButton
        onClick={() => {
          triggerHapticFeedback('medium');
          navigate('/discover?view=map');
        }}
        icon={<Map size={20} />}
        label="Quick Map"
        variant="default"
      />

      {/* Onboarding Dialog - Mobile optimized */}
      <MobileDialog
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        title="Welcome to Plaquer"
        size="md"
        footer={
          <div className="flex justify-between items-center w-full">
            {/* Progress indicators */}
            <div className="flex gap-1">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${index === onboardingStep ? 'bg-blue-500' : 'bg-gray-200'}`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <MobileButton
                variant="outline"
                onClick={() => {
                  triggerHapticFeedback('light');
                  setShowOnboarding(false);
                }}
                touchOptimized
              >
                Skip
              </MobileButton>
              <MobileButton
                onClick={() => {
                  triggerHapticFeedback('light');
                  if (onboardingStep < onboardingSteps.length - 1) {
                    setOnboardingStep(onboardingStep + 1);
                  } else {
                    setShowOnboarding(false);
                  }
                }}
                touchOptimized
              >
                {onboardingStep < onboardingSteps.length - 1
                  ? 'Next'
                  : 'Get Started'}
              </MobileButton>
            </div>
          </div>
        }
      >
        <OnboardingStepContent step={onboardingStep} steps={onboardingSteps} />
      </MobileDialog>
    </PageContainer>
  );
};

export default Home;
