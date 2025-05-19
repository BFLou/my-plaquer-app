// src/components/home/EnhancedHowItWorks.tsx
import React, { useState, useEffect } from 'react';
import { Map, Camera, ListChecks, ChevronRight, MapPin, BookmarkPlus, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EnhancedHowItWorks = ({ onStartJourney }) => {
  // State for animation tracking
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  // Features data with extended details and updated stats
  const features = [
    {
      icon: <Map className="h-8 w-8" />,
      title: "Discover",
      subtitle: "Find historic landmarks",
      description: "Use our interactive map to locate London's iconic blue plaques marking where famous historical figures lived and worked.",
      color: "blue",
      stats: [
        { value: "3000+", label: "Blue plaques" },
        { value: "150+", label: "Years of history" }
      ]
    },
    {
      icon: <Camera className="h-8 w-8" />,
      title: "Capture",
      subtitle: "Add to your collection",
      description: "Check in at plaque locations, mark them as visited, and optionally add photos to build your personal visited collection.",
      color: "green",
      stats: [
        { value: "Simple", label: "Check-in" },
        { value: "Personal", label: "Journey" }
      ]
    },
    {
      icon: <ListChecks className="h-8 w-8" />,
      title: "Curate",
      subtitle: "Create themed collections",
      description: "Organize your visited plaques into custom collections based on themes, time periods, or neighborhoods.",
      color: "purple",
      stats: [
        { value: "Custom", label: "Categories" },
        { value: "Easy", label: "Sharing" }
      ]
    }
  ];

  // Intersection observer to trigger animations when element comes into view
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsVisible(true);
      }
    }, { threshold: 0.1 });

    const section = document.getElementById('how-it-works-section');
    if (section) observer.observe(section);

    return () => {
      if (section) observer.unobserve(section);
    };
  }, []);

  // Auto cycle through features with a slower speed (8 seconds instead of 5)
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % features.length);
    }, 8000); // Slowed down from 5000 to 8000
    
    return () => clearInterval(interval);
  }, [isVisible, features.length]);

  // Function to get border color class based on feature color
  const getBorderClass = (featureColor, isActive) => {
    if (!isActive) return "border-transparent";
    
    switch (featureColor) {
      case "blue":
        return "border-blue-500";
      case "green":
        return "border-green-500";
      case "purple":
        return "border-purple-500";
      default:
        return "border-gray-300";
    }
  };
  
  // Function to get background color class based on feature color
  const getBackgroundClass = (featureColor, isActive) => {
    if (!isActive) return "bg-white hover:bg-gray-50";
    
    switch (featureColor) {
      case "blue":
        return "bg-blue-50";
      case "green":
        return "bg-green-50";
      case "purple":
        return "bg-purple-50";
      default:
        return "bg-gray-50";
    }
  };

  return (
    <section 
      id="how-it-works-section" 
      className="py-16 px-4 bg-gradient-to-b from-white to-blue-50 overflow-hidden"
    >
      <div className="container mx-auto max-w-6xl">
        {/* Section Header with simplified headline */}
        <div className={`text-center mb-12 md:mb-16 transition-all duration-700 transform ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-block bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-sm font-medium mb-4">How Plaquer Works</div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Discover London's Historic Plaques</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Explore thousands of historic plaques across London and create your own personal collection.</p>
        </div>
        
        {/* Main Feature Showcase - Desktop Layout */}
        <div className="hidden md:flex items-stretch gap-8">
          {/* Feature selector sidebar */}
          <div className="w-1/3">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={cn(
                  "p-6 rounded-xl mb-4 cursor-pointer transition-all duration-500 border-l-4",
                  getBorderClass(feature.color, activeFeature === index),
                  getBackgroundClass(feature.color, activeFeature === index),
                  activeFeature === index ? "shadow-md" : ""
                )}
                onClick={() => setActiveFeature(index)}
              >
                <div className="flex items-center mb-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4`} 
                       style={{ 
                         backgroundColor: feature.color === 'blue' ? 'rgba(219, 234, 254, 1)' : 
                                        feature.color === 'green' ? 'rgba(220, 252, 231, 1)' : 
                                        'rgba(243, 232, 255, 1)',
                         color: feature.color === 'blue' ? 'rgba(37, 99, 235, 1)' : 
                                feature.color === 'green' ? 'rgba(22, 163, 74, 1)' : 
                                'rgba(147, 51, 234, 1)'
                       }}>
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{feature.title}</h3>
                    <p className="text-sm text-gray-500">{feature.subtitle}</p>
                  </div>
                </div>
                <div className={cn(
                  "overflow-hidden transition-all duration-500",
                  activeFeature === index ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                )}>
                  <p className="text-gray-700 mt-2">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Feature content area with phone mockup - Updated to match provided images */}
          <div className="w-2/3 bg-white rounded-xl shadow-md overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white"></div>
            
            {/* Phone mockup */}
            <div className="absolute top-8 right-8 w-64">
              <div className="relative">
                {/* Phone frame - updated to match the design in the provided images - removed notch */}
                <div className="w-64 h-[500px] bg-white overflow-hidden shadow-xl rounded-[32px] border-[10px] border-gray-900">
                  {/* Screen content - dynamically shows the active feature */}
                  <div className="h-full overflow-hidden bg-white relative">
                    {features.map((feature, index) => (
                      <div 
                        key={index} 
                        className={cn(
                          "absolute inset-0 transition-all duration-1500 transform", // Slowed down from 1000 to 1500
                          activeFeature === index 
                            ? "opacity-100 translate-x-0" 
                            : activeFeature > index 
                              ? "opacity-0 -translate-x-full" 
                              : "opacity-0 translate-x-full"
                        )}
                      >
                        {/* Mock UI for each feature - Updated to match provided images */}
                        {index === 0 && (
                          <div className="h-full flex flex-col">
                            {/* Header bar - Updated to match blue color and layout in image 1 */}
                            <div className="h-14 flex items-center px-4" style={{ backgroundColor: 'rgba(37, 99, 235, 1)' }}>
                              <MapPin className="text-white h-5 w-5 mr-2" />
                              <span className="text-white text-base font-medium">Plaque Explorer</span>
                            </div>
                            {/* Map area - Updated to match image 1 */}
                            <div className="flex-grow bg-blue-50 relative">
                              <div className="absolute inset-0">
                                {/* Map grid lines */}
                                <div className="absolute inset-0 grid grid-cols-5 grid-rows-8">
                                  {Array(40).fill(0).map((_, i) => (
                                    <div key={i} className="border border-blue-100/50"></div>
                                  ))}
                                </div>
                                
                                {/* Map markers - Positioned to match image 1 */}
                                <div className="absolute top-1/4 left-1/2 w-4 h-4">
                                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                                </div>
                                <div className="absolute bottom-1/4 right-1/3 w-4 h-4">
                                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                                </div>
                                <div className="absolute bottom-1/3 left-1/3 w-4 h-4">
                                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {index === 1 && (
                          <div className="h-full flex flex-col">
                            {/* Header bar */}
                            <div className="h-14 flex items-center px-4" style={{ backgroundColor: 'rgba(22, 163, 74, 1)' }}>
                              <CheckCircle className="text-white h-5 w-5 mr-2" />
                              <span className="text-white text-base font-medium">Visit Tracker</span>
                            </div>
                            <div className="flex-grow bg-white p-4 pt-6">
                              <div className="bg-green-50 rounded-lg p-4 mb-3 border border-green-200 flex items-center">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3">
                                  <CheckCircle className="h-4 w-4" />
                                </div>
                                <div className="flex-grow">
                                  <div className="text-sm font-medium">Charles Dickens</div>
                                  <div className="text-xs text-gray-500">48 Doughty St, Bloomsbury</div>
                                </div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-3">
                                <div className="text-sm font-medium">Recent visits</div>
                                <div className="mt-2 flex justify-between items-center">
                                  <div className="text-xs text-gray-500">This week</div>
                                  <div className="text-sm font-medium">3 plaques</div>
                                </div>
                              </div>
                              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <div className="text-sm font-medium">Achievements</div>
                                <div className="mt-2 flex justify-between items-center">
                                  <div className="text-xs text-gray-500">Explorer Level</div>
                                  <div className="text-sm font-medium">Bronze</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Collections UI - Updated to exactly match image 2 */}
                        {index === 2 && (
                          <div className="h-full flex flex-col">
                            {/* Header bar - Purple header matching image 2 */}
                            <div className="h-14 flex items-center px-4" style={{ backgroundColor: 'rgba(147, 51, 234, 1)' }}>
                              <BookmarkPlus className="text-white h-5 w-5 mr-2" />
                              <span className="text-white text-base font-medium">Collections</span>
                            </div>
                            <div className="flex-grow bg-white p-4 pt-6">
                              {/* Famous Authors card - Exactly matching image 2 */}
                              <div className="bg-purple-50 rounded-lg p-4 mb-3 border border-purple-100">
                                <div className="text-base font-medium">Famous Authors</div>
                                <div className="text-sm text-gray-600">8 plaques collected</div>
                                <div className="mt-2 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '60%' }}></div>
                                </div>
                              </div>
                              
                              {/* Scientists & Inventors card - Exactly matching image 2 */}
                              <div className="bg-blue-50 rounded-lg p-4 mb-3 border border-blue-100">
                                <div className="text-base font-medium">Scientists & Inventors</div>
                                <div className="text-sm text-gray-600">6 plaques collected</div>
                                <div className="mt-2 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '30%' }}></div>
                                </div>
                              </div>
                              
                              {/* Westminster Walks card - Exactly matching image 2 */}
                              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                                <div className="text-base font-medium">Westminster Walks</div>
                                <div className="text-sm text-gray-600">12 plaques collected</div>
                                <div className="mt-2 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-green-500 rounded-full" style={{ width: '70%' }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Feature text content */}
            <div className="p-8 relative z-10 max-w-xs">
              <div style={{ 
                color: activeFeature === 0 ? 'rgba(37, 99, 235, 1)' : 
                      activeFeature === 1 ? 'rgba(22, 163, 74, 1)' : 
                      'rgba(147, 51, 234, 1)',
                fontWeight: 'medium',
                marginBottom: '0.5rem',
                transition: 'all 0.5s ease',
                opacity: isVisible ? '100' : '0'
              }}>
                Step {activeFeature + 1}
              </div>
              <h3 className="text-3xl font-bold mb-4 transition-all duration-500">
                {features[activeFeature].title}
              </h3>
              {/* Fixed height container for description to prevent jumping */}
              <div className="h-24">
                <p className="text-gray-600 transition-all duration-500">
                  {features[activeFeature].description}
                </p>
              </div>
              
              {/* Feature stats */}
              <div className="flex gap-4 mb-8">
                {features[activeFeature].stats.map((stat, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 text-center flex-1">
                    <div style={{ 
                      color: activeFeature === 0 ? 'rgba(37, 99, 235, 1)' : 
                            activeFeature === 1 ? 'rgba(22, 163, 74, 1)' : 
                            'rgba(147, 51, 234, 1)',
                      fontWeight: 'bold',
                      fontSize: '1.25rem'
                    }}>{stat.value}</div>
                    <div className="text-gray-500 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
              
              <Button 
                onClick={onStartJourney}
                className="text-white transition-all px-6 py-2"
                style={{ 
                  backgroundColor: activeFeature === 0 ? 'rgba(37, 99, 235, 1)' : 
                                 activeFeature === 1 ? 'rgba(22, 163, 74, 1)' : 
                                 'rgba(147, 51, 234, 1)',
                }}
              >
                Start Exploring
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile Layout - Improved for better mobile responsiveness */}
        <div className="md:hidden space-y-6">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Tabs for mobile feature selection */}
            <div className="flex border-b">
              {features.map((feature, index) => (
                <button
                  key={index}
                  className="flex-1 py-3 px-2 text-center text-sm font-medium transition-colors"
                  style={{ 
                    color: activeFeature === index 
                      ? (feature.color === 'blue' ? 'rgba(37, 99, 235, 1)' : 
                         feature.color === 'green' ? 'rgba(22, 163, 74, 1)' : 
                         'rgba(147, 51, 234, 1)')
                      : 'rgba(107, 114, 128, 1)',
                    borderBottomWidth: activeFeature === index ? '2px' : '0',
                    borderBottomColor: activeFeature === index 
                      ? (feature.color === 'blue' ? 'rgba(37, 99, 235, 1)' : 
                         feature.color === 'green' ? 'rgba(22, 163, 74, 1)' : 
                         'rgba(147, 51, 234, 1)')
                      : 'transparent',
                    borderBottomStyle: 'solid'
                  }}
                  onClick={() => setActiveFeature(index)}
                >
                  {feature.title}
                </button>
              ))}
            </div>
            
            {/* Mobile feature content with sliding animation */}
            <div className="relative overflow-hidden" style={{ minHeight: '420px' }}>
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="p-6 transition-all duration-500 absolute w-full"
                  style={{ 
                    opacity: activeFeature === index ? 1 : 0,
                    pointerEvents: activeFeature === index ? 'auto' : 'none',
                    transform: activeFeature === index 
                      ? 'translateX(0)' 
                      : activeFeature > index 
                        ? 'translateX(-100%)' 
                        : 'translateX(100%)'
                  }}
                >
                  {/* Feature icon and title */}
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                         style={{ 
                           backgroundColor: feature.color === 'blue' ? 'rgba(219, 234, 254, 1)' : 
                                          feature.color === 'green' ? 'rgba(220, 252, 231, 1)' : 
                                          'rgba(243, 232, 255, 1)',
                           color: feature.color === 'blue' ? 'rgba(37, 99, 235, 1)' : 
                                  feature.color === 'green' ? 'rgba(22, 163, 74, 1)' : 
                                  'rgba(147, 51, 234, 1)'
                         }}>
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{feature.title}</h3>
                      <p className="text-sm text-gray-500">{feature.subtitle}</p>
                    </div>
                  </div>
                  
                  {/* Feature description */}
                  <div className="h-24 mb-6">
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                  
                  {/* Feature stats */}
                  <div className="flex gap-4 mb-6">
                    {feature.stats.map((stat, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3 text-center flex-1">
                        <div style={{ 
                          color: feature.color === 'blue' ? 'rgba(37, 99, 235, 1)' : 
                                feature.color === 'green' ? 'rgba(22, 163, 74, 1)' : 
                                'rgba(147, 51, 234, 1)',
                          fontWeight: 'bold',
                          fontSize: '1.125rem'
                        }}>{stat.value}</div>
                        <div className="text-gray-500 text-xs">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Phone UI preview - simplified for mobile */}
                  <div className="bg-gray-50 rounded-lg p-2 mb-6">
                    <div className="w-full h-[180px] bg-white overflow-hidden rounded-lg shadow-sm">
                      {/* First screen - Map */}
                      {index === 0 && (
                        <div className="h-full flex flex-col">
                          <div className="h-10 flex items-center px-3" style={{ backgroundColor: 'rgba(37, 99, 235, 1)' }}>
                            <MapPin className="text-white h-4 w-4 mr-1" />
                            <span className="text-white text-sm font-medium">Plaque Explorer</span>
                          </div>
                          <div className="flex-grow bg-blue-50"></div>
                        </div>
                      )}
                      
                      {/* Second screen - Capture */}
                      {index === 1 && (
                        <div className="h-full flex flex-col">
                          <div className="h-10 flex items-center px-3" style={{ backgroundColor: 'rgba(22, 163, 74, 1)' }}>
                            <CheckCircle className="text-white h-4 w-4 mr-1" />
                            <span className="text-white text-sm font-medium">Visit Tracker</span>
                          </div>
                          <div className="flex-grow bg-white p-3">
                            <div className="bg-green-50 rounded p-2 border border-green-100 text-xs mb-2">
                              Charles Dickens - Recently visited
                            </div>
                            <div className="bg-gray-50 rounded p-2 border border-gray-100 text-xs">
                              3 plaques this week
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Third screen - Collections */}
                      {index === 2 && (
                        <div className="h-full flex flex-col">
                          <div className="h-10 flex items-center px-3" style={{ backgroundColor: 'rgba(147, 51, 234, 1)' }}>
                            <BookmarkPlus className="text-white h-4 w-4 mr-1" />
                            <span className="text-white text-sm font-medium">Collections</span>
                          </div>
                          <div className="flex-grow bg-white p-3">
                            <div className="bg-purple-50 rounded p-2 text-xs text-purple-800 mb-2">
                              Famous Authors (8)
                            </div>
                            <div className="bg-blue-50 rounded p-2 text-xs text-blue-800">
                              Scientists (6)
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={onStartJourney}
                    className="w-full text-white transition-all py-2.5"
                    style={{ 
                      backgroundColor: feature.color === 'blue' ? 'rgba(37, 99, 235, 1)' : 
                                    feature.color === 'green' ? 'rgba(22, 163, 74, 1)' : 
                                    'rgba(147, 51, 234, 1)'
                    }}
                  >
                    Start Exploring
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EnhancedHowItWorks;