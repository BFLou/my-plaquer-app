// src/pages/Home.tsx - Updated version
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronRight, Map, Camera, ListChecks, User, Navigation, 
  Compass, Info, X, CheckCircle, Search, MapPin, Filter as FilterIcon 
} from 'lucide-react';
import { PageContainer, FeatureCard } from "@/components";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  CategoryCard, PopularLocations, PopularFigures, 
  MapPreview, OnboardingStepContent, CategoriesSection, FeatureItem 
} from "@/components/home/HomeComponents";
import { usePlaqueCounts, getPlaqueCategories } from "@/utils/plaque-utils";

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
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

    // Load simplified map for preview
    initializeMapPreview();

    return () => {
      // Clean up map instance if needed
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/discover?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/discover');
    }
  };

  // Function to initialize a simplified map preview
  const initializeMapPreview = () => {
    // Only initialize if Leaflet is available (via window.L)
    if (!window.L || !mapContainerRef.current) return;

    // Create simplified map
    const map = window.L.map(mapContainerRef.current, {
      center: [51.505, -0.09], // London coordinates
      zoom: 12,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      attributionControl: false
    });

    // Use a styled map tile layer
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add sample plaque locations - fixed to prevent duplicate markers
    const plaqueSamples = [
      { lat: 51.511, lng: -0.119, title: "Charles Dickens", color: "blue" },
      { lat: 51.518, lng: -0.142, title: "Ada Lovelace", color: "blue" },
      { lat: 51.499, lng: -0.135, title: "Florence Nightingale", color: "blue" },
      { lat: 51.523, lng: -0.158, title: "Alan Turing", color: "blue" },
      { lat: 51.530, lng: -0.125, title: "Karl Marx", color: "blue" },
      { lat: 51.507, lng: -0.165, title: "Winston Churchill", color: "blue" },
      { lat: 51.496, lng: -0.145, title: "Charles Darwin", color: "blue" },
    ];

    // Create markers with a cleaner effect (no flashing on hover)
    plaqueSamples.forEach((plaque, index) => {
      // Stagger marker creation for visual effect
      setTimeout(() => {
        createMarker(map, plaque);
      }, index * 200); // Reduced stagger time
    });

    // Add click handler to navigate to discover page
    map.on('click', () => {
      navigate('/discover?view=map');
    });

    // Store the map reference
    mapInstanceRef.current = map;
    setIsMapLoaded(true);
  };

  // Helper to create a marker (simplified, no flashing effect)
  const createMarker = (map: any, plaque: any) => {
    // Create icon with no animation/flashy effects
    const icon = window.L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md">
          <div class="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
            ${plaque.title.charAt(0)}
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    // Create marker
    const marker = window.L.marker([plaque.lat, plaque.lng], { icon }).addTo(map);

    // Add tooltip
    marker.bindTooltip(plaque.title, {
      permanent: false,
      direction: 'top',
      className: 'bg-white px-2 py-1 rounded shadow-md text-xs'
    });

    // Add click handler for this specific marker
    marker.on('click', (e: any) => {
      e.originalEvent.stopPropagation();
      navigate(`/discover?search=${encodeURIComponent(plaque.title)}`);
    });

    return marker;
  };

  // Enhanced search suggestions that appear as you type
  const getSearchSuggestions = () => {
    if (!searchQuery || searchQuery.length < 2) return [];
    
    // Simple mock implementation - in production, this would query your backend
    const allSuggestions = [
      { type: 'person', text: 'Charles Dickens', count: 1 },
      { type: 'person', text: 'Ada Lovelace', count: 1 },
      { type: 'person', text: 'Winston Churchill', count: 2 },
      { type: 'location', text: 'Kensington', count: 47 },
      { type: 'location', text: 'Bloomsbury', count: 35 },
      { type: 'profession', text: 'Scientist', count: 87 },
      { type: 'profession', text: 'Architect', count: 64 },
    ];
    
    // Filter suggestions based on search query
    return allSuggestions.filter(suggestion => 
      suggestion.text.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5); // Limit to 5 results
  };
  
  // Get search suggestions based on current query
  const searchSuggestions = getSearchSuggestions();

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

  // Navigation to the discover page with map view
  const navigateToMapView = () => navigate('/discover?view=map');

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
            
            {/* Right side with map */}
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-72 h-72 md:w-96 md:h-80">
                <div className="absolute inset-0 bg-blue-500 rounded-2xl rotate-6 transform"></div>
                <div className="absolute inset-0 bg-blue-400 rounded-2xl -rotate-3 transform"></div>
                <div className="absolute inset-0 bg-white rounded-2xl shadow-xl overflow-hidden">
                  <MapPreview 
                    isMapLoaded={isMapLoaded}
                    mapContainerRef={mapContainerRef}
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
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-center">Find Blue Plaques</h2>
            
            {/* Improved search input with better focus behavior */}
            <div className="relative mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, location, or profession..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  onFocus={() => setIsSearchFocused(true)}
                  className="w-full px-12 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search size={20} />
                </div>
                <Button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10"
                  onClick={handleSearch}
                >
                  Search
                </Button>
              </div>
            </div>
            
            {/* Search suggestions with improved UX */}
            {(isSearchFocused || searchSuggestions.length > 0) && (
              <div className="mb-5 bg-white rounded-md shadow-md border border-gray-100 divide-y">
                {searchQuery.length < 2 ? (
                  <>
                    {/* Show popular searches using component */}
                    <PopularFigures figures={counts.popularFigures} />
                    <PopularLocations locations={counts.popularLocations} />
                  </>
                ) : (
                  // Show filtered suggestions based on user input
                  searchSuggestions.map((suggestion, index) => (
                    <div 
                      key={index}
                      className="p-3 flex items-center hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSearchQuery(suggestion.text);
                        handleSearch();
                      }}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center mr-3",
                        suggestion.type === 'person' ? 'bg-amber-100 text-amber-600' :
                        suggestion.type === 'location' ? 'bg-green-100 text-green-600' :
                        'bg-purple-100 text-purple-600'
                      )}>
                        {suggestion.type === 'person' ? '👤' : 
                        suggestion.type === 'location' ? '📍' : '🏷️'}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{suggestion.text}</div>
                        <div className="text-xs text-gray-500 capitalize">
                          {suggestion.type} • {suggestion.count} {suggestion.count === 1 ? 'plaque' : 'plaques'}
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-gray-400" />
                    </div>
                  ))
                )}
              </div>
            )}
            
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

      {/* Features Section */}
      <section id="features" className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">How Plaquer Works</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">Discover, collect and share London's fascinating blue plaques all in one place.</p>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            <FeatureCard 
              icon={Map} 
              title="Discover"
              description="Find plaques around London with our interactive map. Uncover hidden stories nearby."
            />
            <FeatureCard 
              icon={Camera} 
              title="Capture"
              description="Add plaques to your collection by taking a photo or checking in at the location."
              color="green"
            />
            <FeatureCard 
              icon={ListChecks} 
              title="Build Lists"
              description="Create custom collections of plaques based on themes, neighborhoods, or personal interests."
              color="purple"
            />
          </div>
          
          {/* "Getting Started" section */}
          <div className="mt-16 bg-blue-50 rounded-xl p-8 border border-blue-100">
            <h3 className="text-xl font-bold text-center mb-8">Getting Started is Easy</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <FeatureItem 
                number={1} 
                title="Explore the Map" 
                description="Browse the interactive map to discover blue plaques near you or in areas of interest."
              />
              <FeatureItem 
                number={2} 
                title="Visit and Check In" 
                description="When you find a plaque in person, mark it as visited and optionally add a photo."
              />
              <FeatureItem 
                number={3} 
                title="Create Collections" 
                description="Organize your visited plaques into themed collections to track your explorations."
              />
            </div>
            <div className="mt-8 text-center">
              <Button 
                onClick={() => navigate('/discover')}
                className="px-6"
              >
                Start Your Journey
              </Button>
            </div>
          </div>
        </div>
      </section>
      
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