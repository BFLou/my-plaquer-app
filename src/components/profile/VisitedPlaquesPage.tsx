// src/components/profile/VisitedPlaquesPage.tsx
import React, { useState } from 'react';
import { MapPin, Calendar, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, isValid } from 'date-fns';
import { usePlaques } from '@/hooks/usePlaques';
import { useNavigate } from 'react-router-dom';
import VisitCalendar from './VisitCalendar';

interface VisitedPlaquesPageProps {
  visits: any[];
  loading: boolean;
}

const VisitedPlaquesPage: React.FC<VisitedPlaquesPageProps> = ({
  visits,
  loading,
}) => {
  const navigate = useNavigate();
  const { plaques } = usePlaques();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('recent');
  const [viewMode, setViewMode] = useState('list');
  const [ratingFilter, setRatingFilter] = useState('all');

  // Format date safely
  const formatVisitDate = (dateValue: any): string => {
    try {
      // Handle Firebase Timestamp
      if (dateValue && typeof dateValue.toDate === 'function') {
        const date = dateValue.toDate();
        return isValid(date) ? format(date, 'MMM d, yyyy') : 'Unknown date';
      }

      // Handle string or number date
      const date = new Date(dateValue);
      return isValid(date) ? format(date, 'MMM d, yyyy') : 'Unknown date';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };

  // Match visits with plaque data
  const getPlaqueData = (plaqueId: number) => {
    return plaques.find((p) => p.id === plaqueId) || null;
  };

  // Filter and sort visits
  const getFilteredAndSortedVisits = () => {
    // First filter by search query and rating
    const filtered = visits.filter((visit) => {
      const plaque = getPlaqueData(visit.plaque_id);

      // Filter by search query
      const matchesSearch =
        !searchQuery ||
        (plaque &&
          (plaque.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            plaque.location
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            plaque.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            visit.notes?.toLowerCase().includes(searchQuery.toLowerCase())));

      // Filter by rating
      const matchesRating =
        ratingFilter === 'all' ||
        (visit.rating && ratingFilter === visit.rating.toString());

      return matchesSearch && matchesRating;
    });

    // Then sort
    return filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'recent':
          const dateA =
            a.visited_at instanceof Date
              ? a.visited_at
              : a.visited_at?.toDate
                ? a.visited_at.toDate()
                : new Date(a.visited_at);
          const dateB =
            b.visited_at instanceof Date
              ? b.visited_at
              : b.visited_at?.toDate
                ? b.visited_at.toDate()
                : new Date(b.visited_at);
          return dateB.getTime() - dateA.getTime();

        case 'oldest':
          const dateC =
            a.visited_at instanceof Date
              ? a.visited_at
              : a.visited_at?.toDate
                ? a.visited_at.toDate()
                : new Date(a.visited_at);
          const dateD =
            b.visited_at instanceof Date
              ? b.visited_at
              : b.visited_at?.toDate
                ? b.visited_at.toDate()
                : new Date(b.visited_at);
          return dateC.getTime() - dateD.getTime();

        case 'a-z':
          const plaqueA = getPlaqueData(a.plaque_id);
          const plaqueB = getPlaqueData(b.plaque_id);
          return (plaqueA?.title || '').localeCompare(plaqueB?.title || '');

        case 'z-a':
          const plaqueC = getPlaqueData(a.plaque_id);
          const plaqueD = getPlaqueData(b.plaque_id);
          return (plaqueD?.title || '').localeCompare(plaqueC?.title || '');

        default:
          return 0;
      }
    });
  };

  const filteredVisits = getFilteredAndSortedVisits();

  return (
    <div className="bg-white shadow-sm rounded-xl p-6">
      <h2 className="text-xl font-bold mb-6">Visited Plaques</h2>

      {/* Search and filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <Input
              type="text"
              placeholder="Search visits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
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

          <Tabs
            value={viewMode}
            onValueChange={setViewMode}
            className="hidden sm:block"
          >
            <TabsList>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="grid">Grid</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Filter size={14} />
            Filters
          </Button>

          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-[120px] h-8">
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

      {/* Mobile tabs */}
      <div className="sm:hidden mb-4">
        <Tabs value={viewMode} onValueChange={setViewMode}>
          <TabsList className="w-full">
            <TabsTrigger value="list" className="flex-1">
              List
            </TabsTrigger>
            <TabsTrigger value="grid" className="flex-1">
              Grid
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex-1">
              Calendar
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="text-gray-500 mt-3">Loading your visits...</p>
        </div>
      ) : visits.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No Visits Yet
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Start exploring and visiting plaques around London. Mark plaques as
            visited to track your discoveries.
          </p>
          <Button onClick={() => navigate('/discover')}>
            Discover Plaques
          </Button>
        </div>
      ) : filteredVisits.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No Matching Visits
          </h3>
          <p className="text-gray-500 mb-4">
            Try changing your search terms or filters
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setRatingFilter('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : viewMode === 'list' ? (
        // List view
        <div className="space-y-3">
          {filteredVisits.map((visit) => {
            const plaque = getPlaqueData(visit.plaque_id);
            return (
              <div
                key={visit.id}
                className="border p-4 rounded-lg hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer transition-colors"
                onClick={() => navigate(`/discover/plaque/${visit.plaque_id}`)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`bg-${plaque?.color || 'blue'}-100 text-${plaque?.color || 'blue'}-500 w-12 h-12 rounded-lg flex items-center justify-center`}
                  >
                    <MapPin size={20} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-lg truncate">
                      {plaque?.title || `Plaque #${visit.plaque_id}`}
                    </h4>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Calendar size={14} className="mr-1 shrink-0" />
                      <span>
                        Visited on {formatVisitDate(visit.visited_at)}
                      </span>
                    </div>
                    {plaque?.location && (
                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {plaque.location}
                      </p>
                    )}
                    {visit.notes && (
                      <p className="text-sm text-gray-600 mt-1 italic truncate">
                        "{visit.notes}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'grid' ? (
        // Grid view
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVisits.map((visit) => {
            const plaque = getPlaqueData(visit.plaque_id);
            return (
              <div
                key={visit.id}
                className="border p-4 rounded-lg hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer transition-colors"
                onClick={() => navigate(`/discover/plaque/${visit.plaque_id}`)}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`bg-${plaque?.color || 'blue'}-100 text-${plaque?.color || 'blue'}-500 w-16 h-16 rounded-lg flex items-center justify-center mb-3`}
                  >
                    <MapPin size={24} />
                  </div>

                  <h4 className="font-medium text-base">
                    {plaque?.title || `Plaque #${visit.plaque_id}`}
                  </h4>
                  <p className="text-sm text-gray-500 flex items-center mt-1">
                    <Calendar size={12} className="mr-1" />
                    {formatVisitDate(visit.visited_at)}
                  </p>
                  {plaque?.location && (
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {plaque.location}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Calendar view
        <VisitCalendar visits={filteredVisits} getPlaqueData={getPlaqueData} />
      )}
    </div>
  );
};

// Add the default export statement here
export default VisitedPlaquesPage;
