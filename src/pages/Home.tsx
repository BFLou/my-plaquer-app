// src/pages/Home.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Map, Camera, ListChecks, User, Navigation, Compass, Info, X, CheckCircle } from "lucide-react";
import { PageContainer, FeatureCard, SearchHero, StatCard } from "@/components";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

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

    // Add some sample plaque locations
    const plaqueSamples = [
      { lat: 51.511, lng: -0.119, title: "Charles Dickens", color: "blue" },
      { lat: 51.518, lng: -0.142, title: "Ada Lovelace", color: "blue" },
      { lat: 51.499, lng: -0.135, title: "Florence Nightingale", color: "blue" },
      { lat: 51.523, lng: -0.158, title: "Alan Turing", color: "blue" },
      { lat: 51.530, lng: -0.125, title: "Karl Marx", color: "blue" },
      { lat: 51.507, lng: -0.165, title: "Winston Churchill", color: "blue" },
      { lat: 51.496, lng: -0.145, title: "Charles Darwin", color: "blue" },
      // Add more sample plaques for visual effect
    ];

    // Create markers with a pulsing effect
    plaqueSamples.forEach((plaque, index) => {
      // Stagger marker creation for visual effect
      setTimeout(() => {
        createPulsingMarker(map, plaque);
      }, index * 300); // Stagger by 300ms
    });

    // Add click handler to navigate to discover page
    map.on('click', () => {
      navigate('/discover?view=map');
    });

    // Store the map reference
    mapInstanceRef.current = map;
    setIsMapLoaded(true);
  };

  // Helper to create a pulsing marker
  const createPulsingMarker = (map: any, plaque: any) => {
    // Create icon
    const icon = window.L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="relative">
          <div class="absolute -top-2 -left-2 w-14 h-14 rounded-full bg-blue-500 opacity-20 animate-ping"></div>
          <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md">
            <div class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              ${plaque.title.charAt(0)}
            </div>
          </div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
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
    marker.on('click', (e) => {
      e.originalEvent.stopPropagation();
      navigate(`/discover?search=${encodeURIComponent(plaque.title)}`);
    });

    return marker;
  };

  // Smart search categories with additional metadata
  const categories = [
    { 
      label: "Famous Authors", 
      icon: "📚",
      count: 124,
      onClick: () => navigate("/discover?professions=author,writer&view=grid") 
    },
    { 
      label: "Women in History", 
      icon: "👑",
      count: 87,
      onClick: () => navigate("/discover?category=women&view=grid") 
    },
    { 
      label: "Scientists", 
      icon: "🧪",
      count: 102,
      onClick: () => navigate("/discover?professions=scientist,researcher,physicist&view=grid") 
    },
    { 
      label: "19th Century", 
      icon: "🕰️",
      count: 156,
      onClick: () => navigate("/discover?period=19th-century&view=grid") 
    },
    { 
      label: "Westminster", 
      icon: "🏛️",
      count: 68,
      onClick: () => navigate("/discover?postcodes=SW1&view=map") 
    },
  ];

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

  return (
    <PageContainer activePage="home" containerClass="flex-grow pb-16 md:pb-0">
      {/* Hero Section */}
      <section className="relative py-16 md:py-20 px-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white"></div>
          <div className="absolute bottom-10 right-20 w-60 h-60 rounded-full bg-white"></div>
          <div className="absolute top-40 right-40 w-20 h-20 rounded-full bg-white"></div>
        </div>
        <div className="container mx-auto relative z-10 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">Discover History Where You Stand</h1>
            <p className="text-lg md:text-xl mb-8 opacity-90">Explore London's iconic blue plaques and build your personal collection of visited landmarks.</p>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => navigate('/discover')} 
                className="bg-white text-blue-600 px-5 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition duration-300 flex items-center gap-2"
              >
                Start Exploring <ChevronRight size={18} />
              </Button>
              <Button 
                variant="outline"
                className="border-white text-white hover:bg-white/20 px-5 py-3 rounded-lg font-medium transition-all"
                onClick={handleNearMe}
              >
                <Navigation size={18} className="mr-2" />
                Near Me
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative w-72 h-72 md:w-96 md:h-80">
              <div className="absolute inset-0 bg-blue-500 rounded-2xl rotate-6 transform"></div>
              <div className="absolute inset-0 bg-blue-400 rounded-2xl -rotate-3 transform"></div>
              <div className="absolute inset-0 bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Interactive Map Preview */}
                <div 
                  ref={mapContainerRef} 
                  className="w-full h-full bg-gray-100 cursor-pointer transition duration-200 hover:opacity-95"
                >
                  {!isMapLoaded && (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                        <p className="text-gray-500 text-sm">Loading map preview...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Overlay button to navigate to discover page */}
                <div className="absolute bottom-4 right-4 left-4">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                    onClick={() => navigate('/discover?view=map')}
                  >
                    <Map size={16} className="mr-2" />
                    Open Full Map
                  </Button>
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
            
            {/* Main search input */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search by name, location, or profession..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-12 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Map size={20} />
              </div>
              <Button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10"
                onClick={handleSearch}
              >
                Search
              </Button>
            </div>
            
            {/* Search suggestions */}
            {searchSuggestions.length > 0 && (
              <div className="mb-5 bg-white rounded-md shadow-md border border-gray-100 divide-y">
                {searchSuggestions.map((suggestion, index) => (
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
                ))}
              </div>
            )}
            
            {/* Category chips */}
            <div className="flex items-center mb-1">
              <span className="text-sm font-medium text-gray-500 mr-3">Explore:</span>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {categories.map((category, index) => (
                  <Button 
                    key={index}
                    variant="outline" 
                    className="whitespace-nowrap flex items-center gap-1 shadow-sm bg-white hover:bg-gray-50 border h-9"
                    onClick={category.onClick}
                  >
                    <span className="mr-1">{category.icon}</span>
                    {category.label}
                    <Badge 
                      variant="secondary" 
                      className="ml-1 bg-gray-100 text-gray-600 font-normal text-xs"
                    >
                      {category.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Near me button for mobile */}
            <div className="mt-4 md:hidden">
              <Button 
                variant="outline"
                className="w-full border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center gap-2 h-12"
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
          
          {/* "Getting Started" section - new section for onboarding */}
          <div className="mt-16 bg-blue-50 rounded-xl p-8 border border-blue-100">
            <h3 className="text-xl font-bold text-center mb-8">Getting Started is Easy</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mx-auto mb-4">1</div>
                <h4 className="font-bold mb-2">Explore the Map</h4>
                <p className="text-gray-600 text-sm">Browse the interactive map to discover blue plaques near you or in areas of interest.</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mx-auto mb-4">2</div>
                <h4 className="font-bold mb-2">Visit and Check In</h4>
                <p className="text-gray-600 text-sm">When you find a plaque in person, mark it as visited and optionally add a photo.</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mx-auto mb-4">3</div>
                <h4 className="font-bold mb-2">Create Collections</h4>
                <p className="text-gray-600 text-sm">Organize your visited plaques into themed collections to track your explorations.</p>
              </div>
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

      {/* Stats Section */}
      <section className="py-12 bg-gray-50 border-y border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard label="Blue Plaques" value="1,000+" />
            <StatCard label="London Boroughs" value="33" />
            <StatCard label="Active Users" value="5,000+" />
            <StatCard label="Years of History" value="150+" />
          </div>
        </div>
      </section>
      
      {/* Featured Content */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Discover London's History</h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            {/* Popular Routes Preview */}
            <div>
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <Compass className="mr-2 text-blue-500" size={22} />
                Popular Walking Routes
              </h3>
              <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition border">
                <div className="space-y-3">
                  {[
                    { name: "Literary Bloomsbury", stops: 8, distance: "2.5 km", time: "45 min", icon: "📚" },
                    { name: "Scientific Pioneers", stops: 6, distance: "1.8 km", time: "30 min", icon: "🔬" },
                    { name: "Political Westminster", stops: 10, distance: "3.2 km", time: "1 hour", icon: "🏛️" }
                  ].map((route, i) => (
                    <div 
                      key={i} 
                      className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-blue-50 transition"
                      onClick={() => navigate(`/discover/routes/${i+1}`)}
                    >
                      <div className="w-10 h-10 rounded-full bg-white border flex items-center justify-center text-xl">
                        {route.icon}
                      </div>
                      <div className="ml-3 flex-1">
                        <h4 className="font-medium">{route.name}</h4>
                        <div className="flex text-xs text-gray-500 gap-3">
                          <span>{route.stops} stops</span>
                          <span>{route.distance}</span>
                          <span>{route.time}</span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-gray-400" />
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/discover/routes')}
                  >
                    View All Routes
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Featured Plaque */}
            <div>
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <div className="w-6 h-6 bg-blue-600 rounded-full mr-2"></div>
                Plaque of the Day
              </h3>
              <div className="bg-white rounded-xl shadow-md overflow-hidden group hover:shadow-lg transition border">
                <div className="h-64 bg-gray-200 relative overflow-hidden">
                  <img src="/api/placeholder/600/400" className="w-full h-full object-cover transition duration-500 group-hover:scale-105" alt="Ada Lovelace Plaque" />
                  <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">Featured</div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold">Ada Lovelace</h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Mathematician</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">10 St James's Square, St. James's, SW1</p>
                  <p className="text-gray-600 mb-4">Pioneer of computing and daughter of Lord Byron, Ada wrote the first algorithm intended to be processed by a machine.</p>
                  <Button 
                    variant="link" 
                    className="text-blue-600 font-medium flex items-center gap-1 text-sm hover:text-blue-800 transition p-0"
                    onClick={() => navigate('/discover/plaque/123')}
                  >
                    View Details <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Onboarding Dialog */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center text-center">
              {onboardingSteps[onboardingStep].icon}
              <DialogTitle className="mt-4">{onboardingSteps[onboardingStep].title}</DialogTitle>
              <DialogDescription className="mt-2">
                {onboardingSteps[onboardingStep].description}
              </DialogDescription>
            </div>
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
    </PageContainer>
  );
};

export default Home;