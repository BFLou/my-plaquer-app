// src/pages/Home.tsx - Updated with EnhancedSearchBar
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronRight, Map, Camera, ListChecks, User, Navigation, 
  Compass, Info, X, CheckCircle, MapPin, Filter as FilterIcon 
} from 'lucide-react';
import { PageContainer } from "@/components";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  CategoryCard, PopularLocations, PopularFigures, 
  OnboardingStepContent, CategoriesSection
} from "@/components/home/HomeComponents";
import EnhancedSearchBar from "@/components/home/EnhancedSearchBar";
import { usePlaqueCounts, getPlaqueCategories } from "@/utils/plaque-utils";
import EnhancedHowItWorks from "@/components/home/EnhancedHowItWorks";

// Famous historical figures data for the map
const famousPlaques = [
  {
    id: 730,
    name: "Alan Turing",
    profession: "Mathematician & Computer Scientist",
    lat: 51.5233,
    lng: -0.1849,
    location: "2 Warrington Crescent, Maida Vale"
  },
  {
    id: 487,
    name: "Ada Lovelace",
    profession: "Mathematician & Writer",
    lat: 51.5079,
    lng: -0.1364,
    location: "12 St James's Square"
  },
  {
    id: 656,
    name: "Florence Nightingale",
    profession: "Nurse & Statistician",
    lat: 51.5083,
    lng: -0.1502,
    location: "10 South Street, Mayfair"
  },
  {
    id: 302,
    name: "Sir Isaac Newton",
    profession: "Physicist & Mathematician",
    lat: 51.50806,
    lng: -0.13682,
    location: "87 Jermyn Street, St James's"
  },
  {
    id: 108,
    name: "Charles Darwin",
    profession: "Naturalist & Biologist",
    lat: 51.5245,
    lng: -0.1334,
    location: "Biological Sciences Building, UCL"
  },
  {
    id: 352,
    name: "Sir Winston Churchill",
    profession: "Prime Minister & Statesman",
    lat: 51.50207, 
    lng: -0.18019,
    location: "28 Hyde Park Gate, Kensington"
  },
  {
    id: 372,
    name: "Charles Dickens",
    profession: "Novelist",
    lat: 51.5223, 
    lng: -0.1146,
    location: "48 Doughty Street, Holborn"
  },
  {
    id: 296,
    name: "Karl Marx",
    profession: "Philosopher & Economist",
    lat: 51.5137, 
    lng: -0.1332,
    location: "28 Dean Street, Soho"
  }
];

// Enhanced Map Preview component
const EnhancedMapPreview = ({ navigateToDiscover }) => {
  const mapContainerRef = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
  // Initialize map
  useEffect(() => {
    if (!window.L || !mapContainerRef.current) return;
    
    // Create simplified map with disabled controls for simplicity
    const map = window.L.map(mapContainerRef.current, {
      center: [51.51, -0.14], // Centered on London
      zoom: 13,
      zoomControl: false,     // Disable zoom controls
      dragging: false,        // Disable dragging
      scrollWheelZoom: false, // Disable scroll zoom
      doubleClickZoom: false, // Disable double-click zoom
      attributionControl: true
    });
    
    // Use a styled map tile layer
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Create a custom tooltip div directly in the DOM
    const tooltipEl = document.createElement('div');
    tooltipEl.className = 'custom-map-tooltip';
    tooltipEl.style.display = 'none';
    tooltipEl.style.position = 'absolute';
    tooltipEl.style.zIndex = '9999';
    tooltipEl.style.backgroundColor = '#3B82F6';
    tooltipEl.style.color = 'white';
    tooltipEl.style.padding = '10px';
    tooltipEl.style.borderRadius = '8px';
    tooltipEl.style.minWidth = '180px';
    tooltipEl.style.maxWidth = '220px';
    tooltipEl.style.textAlign = 'center';
    tooltipEl.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    tooltipEl.style.pointerEvents = 'none'; // Let clicks pass through
    tooltipEl.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    mapContainerRef.current.appendChild(tooltipEl);

    // Add famous plaques as simple markers
    famousPlaques.forEach((plaque) => {
      const icon = window.L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110">
            <div class="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              ${plaque.name.charAt(0)}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = window.L.marker([plaque.lat, plaque.lng], { 
        icon,
        interactive: true
      }).addTo(map);
      
      // Manual tooltip handling for more control
      marker.on('mouseover', function(e) {
        // Set tooltip content
        tooltipEl.innerHTML = `
          <div style="font-weight: 600; font-size: 14px;">${plaque.name}</div>
          <div style="font-size: 12px; opacity: 0.9;">${plaque.profession}</div>
          <div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">${plaque.location}</div>
        `;
        
        // Get pixel coordinates of the marker
        const point = map.latLngToContainerPoint(e.target.getLatLng());
        
        // Calculate safe position within map bounds
        const tooltipWidth = 200; // Approximate width
        const tooltipHeight = 80; // Approximate height
        const mapWidth = mapContainerRef.current.clientWidth;
        const mapHeight = mapContainerRef.current.clientHeight;
        
        // Default position above marker
        let top = point.y - tooltipHeight - 10;
        let left = point.x - (tooltipWidth / 2);
        
        // Adjust position to keep inside map
        if (top < 10) top = point.y + 35; // Place below if too close to top
        if (left < 10) left = 10;
        if (left + tooltipWidth > mapWidth - 10) left = mapWidth - tooltipWidth - 10;
        if (top + tooltipHeight > mapHeight - 60) top = mapHeight - tooltipHeight - 60; // Keep above button
        
        // Position tooltip
        tooltipEl.style.left = `${left}px`;
        tooltipEl.style.top = `${top}px`;
        
        // Show tooltip
        tooltipEl.style.display = 'block';
      });
      
      marker.on('mouseout', function() {
        // Hide tooltip
        tooltipEl.style.display = 'none';
      });
      
      // Make marker clickable to navigate to that specific plaque
      marker.on('click', (e) => {
        e.originalEvent.stopPropagation();
        navigateToDiscover(`/discover?view=map&search=${encodeURIComponent(plaque.name)}`);
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
  }, [navigateToDiscover]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      {/* Map container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full bg-gray-100 cursor-pointer"
        style={{ minHeight: '280px' }}
        onClick={() => navigateToDiscover('/discover?view=map')}
      />
      
      {/* Fixed bottom button for better visibility */}
      <div className="absolute bottom-4 right-4 left-4">
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          onClick={() => navigateToDiscover('/discover?view=map')}
        >
          Explore Full Map
        </Button>
      </div>
      
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

  // Handle search submission
  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/discover?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/discover');
    }
  };

  // Navigation to the discover page with map view
  const navigateToMapView = (path = '/discover?view=map') => navigate(path);

  // Handle near me button click
  const handleNearMe = () => {
    if (navigator.geolocation) {
      toast.loading("Finding your location...");
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          toast.dismiss();
          const { latitude, longitude } = position.coords;
          navigate(`/discover?view=map&lat=${latitude}&lng=${longitude}&zoom=15`);
        },
        (error) => {
          toast.dismiss();
          toast.error("Could not determine your location. Please allow location access.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  // Onboarding steps content
  const onboardingSteps = [
    {
      title: "Welcome to Plaquer",
      description: "Discover, track and collect London's iconic blue plaques marking historical sites across the city.",
      icon: <Info size={40} className="text-blue-500" />
    },
    {
      title: "Find Plaques",
      description: "Use our interactive map to locate blue plaques near you or search for specific historical figures.",
      icon: <Map size={40} className="text-blue-500" />
    },
    {
      title: "Build Your Collection",
      description: "Visit plaques in person, mark them as visited, and create themed collections of your favorites.",
      icon: <CheckCircle size={40} className="text-blue-500" />
    }
  ];

  return (
    <PageContainer activePage="home" containerClass="flex-grow pb-16 md:pb-0">
      {/* Hero Section - With map on the right */}
      <section className="relative py-16 md:py-20 px-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white"></div>
          <div className="absolute bottom-10 right-20 w-60 h-60 rounded-full bg-white"></div>
          <div className="absolute top-40 right-40 w-20 h-20 rounded-full bg-white"></div>
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            {/* Left side with content */}
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">Discover History Where You Stand</h1>
              <p className="text-lg md:text-xl mb-8 opacity-90">Explore London's iconic blue plaques and build your personal collection of visited landmarks.</p>
              <Button 
                onClick={() => navigate('/discover')} 
                className="bg-white text-blue-600 px-5 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition duration-300 flex items-center gap-2"
              >
                Start Exploring <ChevronRight size={18} />
              </Button>
            </div>
            
            {/* Right side with enhanced map */}
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-72 h-72 md:w-96 md:h-80">
                <div className="absolute inset-0 bg-blue-500 rounded-2xl rotate-6 transform"></div>
                <div className="absolute inset-0 bg-blue-400 rounded-2xl -rotate-3 transform"></div>
                <div className="absolute inset-0 bg-white rounded-2xl shadow-xl overflow-hidden">
                  {/* Use the enhanced map component */}
                  <EnhancedMapPreview 
                    navigateToDiscover={navigateToMapView}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Search Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 -mt-12 relative z-20 max-w-3xl mx-auto">
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-center">Find Plaques</h2>
            
            {/* Using the EnhancedSearchBar component instead of the previous search input */}
            <div className="mb-4">
              <EnhancedSearchBar onSearch={handleSearch} />
            </div>
            
            {/* Improved filter categories with clear sections */}
            <div className="space-y-3">
              <div className="flex items-center">
                <FilterIcon size={14} className="text-gray-500 mr-2" />
                <h3 className="text-sm font-medium text-gray-700">Explore by Category</h3>
              </div>
              
              {/* Use the CategoriesSection component with categories from plaque-utils */}
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-1">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-100 animate-pulse rounded"></div>
                  ))}
                </div>
              ) : (
                <CategoriesSection categories={categories} />
              )}
            </div>
            
            {/* Near me button - Prominently displayed */}
            <div className="mt-4">
              <Button 
                className="w-full bg-blue-600 text-white flex items-center justify-center gap-2 h-12 hover:bg-blue-700"
                onClick={handleNearMe}
              >
                <Navigation size={18} />
                Find Plaques Near Me
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - REPLACED with Enhanced How It Works Component */}
      <EnhancedHowItWorks onStartJourney={() => navigate('/discover')} />
      
      {/* Mobile Nav (mobile only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-40">
        <div className="flex justify-around">
          {[
            { icon: Map, label: "Explore", path: "/discover" },
            { icon: Camera, label: "Recent", path: "/recent" },
            { icon: ListChecks, label: "Collections", path: "/collections" },
            { icon: User, label: "Profile", path: "/profile" }
          ].map((item, index) => (
            <Button 
              key={index} 
              variant="ghost"
              className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-blue-600 h-auto"
              onClick={() => navigate(item.path)}
            >
              <item.icon size={20} />
              <span className="text-xs mt-1">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Onboarding Dialog */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <OnboardingStepContent step={onboardingStep} steps={onboardingSteps} />
          </DialogHeader>
          
          <div className="flex justify-between items-center mt-6">
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
              <Button
                variant="outline"
                onClick={() => setShowOnboarding(false)}
              >
                Skip
              </Button>
              <Button
                onClick={() => {
                  if (onboardingStep < onboardingSteps.length - 1) {
                    setOnboardingStep(onboardingStep + 1);
                  } else {
                    setShowOnboarding(false);
                  }
                }}
              >
                {onboardingStep < onboardingSteps.length - 1 ? 'Next' : 'Get Started'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default Home;