// First, let's create an improved VisitedPlaquesPanel component
// src/components/profile/VisitedPlaquesPanel.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, ChevronRight, ArrowUpDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isValid } from 'date-fns';
import { usePlaques } from '@/hooks/usePlaques';
import { Plaque } from '@/types/plaque';

// Add type for the visit data
interface VisitData {
  id: string;
  plaque_id: number;
  user_id: string;
  visited_at: any; // Can be Date, Firebase Timestamp, or string
  notes?: string;
  rating?: number;
}

interface VisitedPlaquesPanelProps {
  visits: VisitData[];
  showAll?: () => void;
  title?: string;
  limit?: number;
  className?: string;
}

const VisitedPlaquesPanel: React.FC<VisitedPlaquesPanelProps> = ({
  visits,
  showAll,
  title = "Recently Visited Plaques",
  limit = 5,
  className = '',
}) => {
  const navigate = useNavigate();
  const { plaques, loading } = usePlaques();
  const [visitedPlaques, setVisitedPlaques] = useState<Array<{ visit: VisitData; plaque: Plaque | null }>>([]);
  const [sortOrder, setSortOrder] = useState<string>("recent");

  // Match plaque data with visits
  useEffect(() => {
    if (!loading && plaques.length > 0 && visits.length > 0) {
      // Create a map of plaque IDs to plaque data for quick lookup
      const plaqueMap = new Map(plaques.map(plaque => [plaque.id, plaque]));
      
      // Match visits with plaques
      const matched = visits.map(visit => ({
        visit,
        plaque: plaqueMap.get(visit.plaque_id) || null
      }));
      
      setVisitedPlaques(matched);
    } else if (visits.length === 0) {
      setVisitedPlaques([]);
    }
  }, [visits, plaques, loading]);

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

  // Sort visits based on selected order
  const getSortedVisits = () => {
    const sorted = [...visitedPlaques];
    
    switch(sortOrder) {
      case "recent":
        return sorted.sort((a, b) => {
          const dateA = a.visit.visited_at instanceof Date ? a.visit.visited_at : 
                       (a.visit.visited_at?.toDate ? a.visit.visited_at.toDate() : new Date(a.visit.visited_at));
          const dateB = b.visit.visited_at instanceof Date ? b.visit.visited_at : 
                       (b.visit.visited_at?.toDate ? b.visit.visited_at.toDate() : new Date(b.visit.visited_at));
          return dateB.getTime() - dateA.getTime();
        });
      case "oldest":
        return sorted.sort((a, b) => {
          const dateA = a.visit.visited_at instanceof Date ? a.visit.visited_at : 
                       (a.visit.visited_at?.toDate ? a.visit.visited_at.toDate() : new Date(a.visit.visited_at));
          const dateB = b.visit.visited_at instanceof Date ? b.visit.visited_at : 
                       (b.visit.visited_at?.toDate ? b.visit.visited_at.toDate() : new Date(b.visit.visited_at));
          return dateA.getTime() - dateB.getTime();
        });
      case "a-z":
        return sorted.sort((a, b) => {
          const nameA = a.plaque?.title || '';
          const nameB = b.plaque?.title || '';
          return nameA.localeCompare(nameB);
        });
      case "z-a":
        return sorted.sort((a, b) => {
          const nameA = a.plaque?.title || '';
          const nameB = b.plaque?.title || '';
          return nameB.localeCompare(nameA);
        });
      default:
        return sorted;
    }
  };

  // Get sorted and limited visits
  const visitsToDisplay = getSortedVisits().slice(0, limit);

  return (
    <div className={`bg-white shadow-sm rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">{title}</h3>
        
        <div className="flex items-center gap-2">
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[160px] h-8 text-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="a-z">A to Z</SelectItem>
              <SelectItem value="z-a">Z to A</SelectItem>
            </SelectContent>
          </Select>
          
          {showAll && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={showAll}
              className="h-8"
            >
              View All
            </Button>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="text-gray-500 mt-2">Loading visits...</p>
        </div>
      ) : visitedPlaques.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MapPin className="mx-auto text-gray-300 mb-3" size={32} />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Visits Yet</h3>
          <p className="text-gray-500 mb-4">Start exploring and visiting plaques around London</p>
          <Button 
            onClick={() => navigate('/discover')}
          >
            Discover Plaques
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {visitsToDisplay.map((item) => (
            <div 
              key={item.visit.id}
              className="border p-4 rounded-lg hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer transition-colors flex items-center gap-4"
              onClick={() => navigate(`/discover/plaque/${item.visit.plaque_id}`)}
            >
              <div className={`bg-${item.plaque?.color || 'blue'}-100 text-${item.plaque?.color || 'blue'}-500 w-12 h-12 rounded-lg flex items-center justify-center`}>
                <MapPin size={20} />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-lg truncate">
                  {item.plaque?.title || `Plaque #${item.visit.plaque_id}`}
                </h4>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Calendar size={14} className="mr-1 shrink-0" />
                  <span>Visited on {formatVisitDate(item.visit.visited_at)}</span>
                </div>
                {item.plaque?.location && (
                  <p className="text-sm text-gray-600 mt-1 truncate">{item.plaque.location}</p>
                )}
                {item.visit.notes && (
                  <p className="text-sm text-gray-600 mt-1 italic truncate">"{item.visit.notes}"</p>
                )}
              </div>
              
              <ChevronRight size={18} className="text-gray-400 shrink-0" />
            </div>
          ))}
          
          {visits.length > limit && showAll && (
            <Button 
              variant="outline" 
              className="w-full mt-2"
              onClick={showAll}
            >
              Show All {visits.length} Visits
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default VisitedPlaquesPanel;