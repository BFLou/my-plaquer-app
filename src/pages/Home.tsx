import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Map, Camera, ListChecks, User } from "lucide-react";
import { 
  PageContainer,
  FeatureCard,
  SearchHero,
  StatCard
} from "@/components";
import { Button } from "@/components/ui/button";

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/discover?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/discover');
    }
  };

  // Featured categories for quick navigation
  const categories = [
    { label: "Famous Authors", onClick: () => navigate("/discover?category=authors") },
    { label: "Women in History", onClick: () => navigate("/discover?category=women") },
    { label: "Scientists", onClick: () => navigate("/discover?category=scientists") },
    { label: "19th Century", onClick: () => navigate("/discover?period=19th-century") },
    { label: "Westminster", onClick: () => navigate("/discover?location=westminster") },
  ];

  return (
    <PageContainer activePage="home" containerClass="flex-grow">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-4 bg-blue-600 text-white overflow-hidden">
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
                variant="ghost"
                className="bg-blue-700 text-white px-5 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition duration-300"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                How It Works
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative w-72 h-72 md:w-80 md:h-80">
              <div className="absolute inset-0 bg-blue-500 rounded-2xl rotate-6 transform"></div>
              <div className="absolute inset-0 bg-blue-400 rounded-2xl -rotate-3 transform"></div>
              <div className="absolute inset-0 bg-white rounded-2xl shadow-xl overflow-hidden">
                <img src="/api/placeholder/400/400" alt="Blue plaque collection" className="object-cover w-full h-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 -mt-12 relative z-20 max-w-3xl mx-auto">
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-center">Find Blue Plaques Near You</h2>
            <SearchHero
              title=""
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              onSearch={handleSearch}
              categories={categories}
              className="bg-transparent p-0 from-transparent to-transparent"
            />
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
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto grid md:grid-cols-2 gap-12">
          {/* Map Preview */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Explore London</h2>
            <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="bg-gray-200 h-80 rounded-lg flex items-center justify-center relative overflow-hidden group">
                <img src="/api/placeholder/800/600" alt="London Map" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button 
                    onClick={() => navigate('/discover?view=map')}
                    className="bg-white bg-opacity-90 text-blue-600 px-4 py-2 rounded-lg shadow-lg hover:bg-opacity-100 transition flex items-center gap-2"
                  >
                    <Map size={18} />
                    Open Interactive Map
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Featured Plaque */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Featured Plaque</h2>
            <div className="bg-white rounded-xl shadow-md overflow-hidden group hover:shadow-lg transition">
              <div className="h-64 bg-gray-200 relative overflow-hidden">
                <img src="/api/placeholder/600/400" className="w-full h-full object-cover transition duration-500 group-hover:scale-105" alt="Ada Lovelace Plaque" />
                <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">Recently Added</div>
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
    </PageContainer>
  );
};

export default Home;