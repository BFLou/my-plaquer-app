// src/pages/VisitsPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  Calendar, 
  MapPin,
  Search,
  Filter,
  Grid,
  List,
  X
} from 'lucide-react';
import { PageContainer } from "@/components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/hooks/useAuth';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { usePlaques } from '@/hooks/usePlaques';
import VisitedPlaquesPage from '@/components/profile/VisitedPlaquesPage';
import VisitCalendar from '@/components/profile/VisitCalendar';

const VisitsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { visits, loading } = useVisitedPlaques();
  const { plaques } = usePlaques();
  
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('recent');
  const [ratingFilter, setRatingFilter] = useState('all');

  // Calculate stats
  const totalVisits = visits.length;
  const uniquePlaquesVisited = new Set(visits.map(v => v.plaque_id)).size;
  
  // Calculate this month's visits
  const thisMonth = new Date();
  const firstDayOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
  const thisMonthVisits = visits.filter(visit => {
    const visitDate = visit.visited_at?.toDate ? visit.visited_at.toDate() : new Date(visit.visited_at);
    return visitDate >= firstDayOfMonth;
  }).length;

  // Get plaque details for visits
  const getPlaqueData = (plaqueId: number) => {
    return plaques.find(p => p.id === plaqueId) || null;
  };

  if (!user) {
    return (
      <PageContainer activePage="library" simplifiedFooter={true}>
        <div className="container mx-auto py-8 px-4 text-center">
          <div className="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto">
            <CheckCircle className="mx-auto text-gray-300 mb-4" size={48} />
            <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
            <p className="text-gray-600 mb-6">You need to sign in to view your visits.</p>
            <Button onClick={() => navigate('/')}>Back to Home</Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer activePage="library" simplifiedFooter={true}>
      {/* Header with breadcrumb */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-700 text-white py-6 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white"></div>
          <div className="absolute bottom-10 right-20 w-48 h-48 rounded-full bg-white"></div>
          <div className="absolute top-32 right-32 w-16 h-16 rounded-full bg-white"></div>
        </div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/library')} 
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <ArrowLeft size={18} />
            </Button>
            <a 
              className="text-white/80 hover:text-white text-sm cursor-pointer" 
              onClick={() => navigate('/library')}
            >
              My Library
            </a>
            <span className="text-white/50">/</span>
            <span className="text-white font-medium">Visits</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <CheckCircle size={24} className="text-white" />
              <div>
                <h1 className="text-2xl font-bold">My Visits</h1>
                <p className="opacity-90 text-sm">
                  {totalVisits} visits • {uniquePlaquesVisited} unique plaques • {thisMonthVisits} this month
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4">
        {/* Stats Banner */}
        <div className="bg-white rounded-lg shadow-sm p-4 flex justify-between items-center -mt-5 mb-6 relative z-10">
          <div className="flex gap-6 items-center">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{totalVisits}</div>
              <div className="text-xs text-gray-500">Total Visits</div>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{uniquePlaquesVisited}</div>
              <div className="text-xs text-gray-500">Unique Plaques</div>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{thisMonthVisits}</div>
              <div className="text-xs text-gray-500">This Month</div>
            </div>
          </div>
          
          <Button onClick={() => navigate('/discover')}>
            Discover More Plaques
          </Button>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          {/* View Mode Tabs */}
          <div className="p-4 border-b">
            <Tabs value={viewMode} onValueChange={setViewMode}>
              <TabsList>
                <TabsTrigger value="list">
                  <List size={16} className="mr-2" />
                  List View
                </TabsTrigger>
                <TabsTrigger value="grid">
                  <Grid size={16} className="mr-2" />
                  Grid View
                </TabsTrigger>
                <TabsTrigger value="calendar">
                  <Calendar size={16} className="mr-2" />
                  Calendar View
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Search and Filters */}
          <div className="p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input
                type="text"
                placeholder="Search visits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="a-z">A to Z</SelectItem>
                <SelectItem value="z-a">Z to A</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
                <SelectItem value="0">No Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'calendar' ? (
          <div className="bg-white rounded-lg shadow-sm">
            <VisitCalendar 
              visits={visits} 
              getPlaqueData={getPlaqueData}
            />
          </div>
        ) : (
          <VisitedPlaquesPage 
            visits={visits} 
            loading={loading}
          />
        )}
      </div>
    </PageContainer>
  );
};

export default VisitsPage;