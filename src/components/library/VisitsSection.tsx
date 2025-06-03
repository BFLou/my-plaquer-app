// src/components/library/VisitsSection.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  ArrowRight, 
  TrendingUp,
  Clock,
  CheckCircle,
  MoreHorizontal,
  Eye
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTimeAgo } from '@/utils/timeUtils';
import { usePlaques } from '@/hooks/usePlaques';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VisitsSectionProps {
  visits: any[];
  onViewAll: () => void;
  onExploreMore: () => void;
}

const VisitsSection: React.FC<VisitsSectionProps> = ({
  visits,
  onViewAll,
  onExploreMore
}) => {
  const navigate = useNavigate();
  const { plaques } = usePlaques();

  // Get recent visits (up to 4)
  const recentVisits = [...visits]
    .sort((a, b) => {
      const dateA = a.visited_at?.toDate ? a.visited_at.toDate() : new Date(a.visited_at);
      const dateB = b.visited_at?.toDate ? b.visited_at.toDate() : new Date(b.visited_at);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 4);

  // Get plaque details for visits
  const getVisitsWithDetails = () => {
    return recentVisits.map(visit => {
      const plaque = plaques.find(p => p.id === visit.plaque_id);
      return {
        ...visit,
        plaque: plaque || {
          id: visit.plaque_id,
          title: `Plaque #${visit.plaque_id}`,
          location: 'Location unknown',
          color: 'blue'
        }
      };
    });
  };

  const visitsWithDetails = getVisitsWithDetails();
  const uniquePlaquesVisited = new Set(visits.map(v => v.plaque_id)).size;

  // Calculate this month's visits
  const thisMonth = new Date();
  const firstDayOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
  const thisMonthVisits = visits.filter(visit => {
    const visitDate = visit.visited_at?.toDate ? visit.visited_at.toDate() : new Date(visit.visited_at);
    return visitDate >= firstDayOfMonth;
  }).length;

  const handleVisitClick = (plaqueId: number) => {
    navigate(`/discover/plaque/${plaqueId}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
      <div className="flex items-start justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <CheckCircle className="text-blue-500 flex-shrink-0" size={20} />
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold">Recent Visits</h2>
            <p className="text-xs sm:text-sm text-gray-500">
              {visits.length} total visits
              <span className="hidden sm:inline"> • {uniquePlaquesVisited} unique plaques</span>
              <span className="hidden lg:inline"> • {thisMonthVisits} this month</span>
            </p>
            {/* Mobile: Show additional stats on separate lines */}
            <div className="sm:hidden space-y-0.5">
              <p className="text-xs text-gray-400">
                {uniquePlaquesVisited} unique plaques
              </p>
              {thisMonthVisits > 0 && (
                <p className="text-xs text-gray-400">
                  {thisMonthVisits} this month
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Action buttons - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onExploreMore}
            className="gap-1 h-8 sm:h-10 text-xs sm:text-sm min-w-[80px] sm:min-w-0"
          >
            <MapPin size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Explore More</span>
            <span className="xs:hidden">Explore</span>
          </Button>
          
          {visits.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onViewAll}
              className="gap-1 h-8 sm:h-10 text-xs sm:text-sm min-w-[70px] sm:min-w-0"
            >
              <span className="hidden xs:inline">View All</span>
              <span className="xs:hidden">All</span>
              <ArrowRight size={14} className="sm:w-4 sm:h-4" />
            </Button>
          )}
        </div>
      </div>

      {visits.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
          <CheckCircle className="mx-auto text-gray-300 mb-3" size={40} />
          <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-2">No Visits Yet</h3>
          <p className="text-sm text-gray-500 mb-4 sm:mb-6 max-w-md mx-auto px-4">
            Start exploring London's blue plaques and mark them as visited
          </p>
          <Button onClick={onExploreMore} className="gap-2 h-10 sm:h-12">
            <MapPin size={16} />
            Start Exploring
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Quick Stats - Mobile Optimized */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 bg-blue-50 rounded-lg">
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-blue-600">{visits.length}</div>
              <div className="text-xs text-blue-600">Total Visits</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-green-600">{uniquePlaquesVisited}</div>
              <div className="text-xs text-green-600">Unique Plaques</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-purple-600">{thisMonthVisits}</div>
              <div className="text-xs text-purple-600">This Month</div>
            </div>
          </div>

          {/* Recent Visits List - Mobile Optimized */}
          <div className="space-y-2 sm:space-y-3">
            {visitsWithDetails.map((visit, index) => (
              <div 
                key={visit.id || `${visit.plaque_id}-${index}`}
                className="flex items-center gap-3 sm:gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                onClick={() => handleVisitClick(visit.plaque_id)}
              >
                <div className={`bg-${visit.plaque.color || 'blue'}-100 text-${visit.plaque.color || 'blue'}-600 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  <MapPin size={16} className="sm:w-5 sm:h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium truncate text-sm sm:text-base group-hover:text-blue-600 transition-colors">
                        {visit.plaque.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500 mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>{formatTimeAgo(visit.visited_at)}</span>
                        </div>
                        {visit.plaque.location && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span className="truncate max-w-[120px] sm:max-w-none">
                              {visit.plaque.location}
                            </span>
                          </>
                        )}
                      </div>
                      
                      {/* Mobile: Show location on separate line */}
                      {visit.plaque.location && (
                        <div className="sm:hidden mt-1">
                          <span className="text-xs text-gray-500 truncate block">
                            {visit.plaque.location}
                          </span>
                        </div>
                      )}
                      
                      {visit.notes && (
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs bg-blue-50">
                            Has notes
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    {/* Mobile menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity sm:hidden flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleVisitClick(visit.plaque_id);
                        }}>
                          <Eye size={14} className="mr-2" />
                          View Plaque
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {/* Desktop: Show time icon */}
                    <div className="hidden sm:block">
                      <Clock size={14} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* View All Button - Mobile Optimized */}
          {visits.length > 4 && (
            <div className="pt-2 border-t border-gray-100">
              <Button 
                variant="ghost" 
                onClick={onViewAll} 
                className="w-full gap-2 h-10 sm:h-12 text-sm sm:text-base"
              >
                View All {visits.length} Visits
                <ArrowRight size={16} />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VisitsSection;