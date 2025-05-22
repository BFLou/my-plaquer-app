// src/components/library/VisitsSection.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  ArrowRight, 
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTimeAgo } from '@/utils/timeUtils';
import { usePlaques } from '@/hooks/usePlaques';

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
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CheckCircle className="text-blue-500" size={24} />
          <div>
            <h2 className="text-xl font-bold">Recent Visits</h2>
            <p className="text-sm text-gray-500">
              {visits.length} total visits • {uniquePlaquesVisited} unique plaques • {thisMonthVisits} this month
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onExploreMore}
            className="gap-1"
          >
            <MapPin size={16} />
            Explore More
          </Button>
          {visits.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onViewAll}
              className="gap-1"
            >
              View All
              <ArrowRight size={16} />
            </Button>
          )}
        </div>
      </div>

      {visits.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CheckCircle className="mx-auto text-gray-300 mb-3" size={48} />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Visits Yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Start exploring London's blue plaques and mark them as visited
          </p>
          <Button onClick={onExploreMore} className="gap-2">
            <MapPin size={16} />
            Start Exploring
          </Button>
        </div>
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{visits.length}</div>
              <div className="text-xs text-blue-600">Total Visits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{uniquePlaquesVisited}</div>
              <div className="text-xs text-green-600">Unique Plaques</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{thisMonthVisits}</div>
              <div className="text-xs text-purple-600">This Month</div>
            </div>
          </div>

          {/* Recent Visits List */}
          <div className="space-y-3">
            {visitsWithDetails.map((visit, index) => (
              <div 
                key={visit.id || index}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => handleVisitClick(visit.plaque_id)}
              >
                <div className={`bg-${visit.plaque.color || 'blue'}-100 text-${visit.plaque.color || 'blue'}-600 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0`}>
                  <MapPin size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{visit.plaque.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <Calendar size={12} />
                    <span>{formatTimeAgo(visit.visited_at)}</span>
                    {visit.plaque.location && (
                      <>
                        <span>•</span>
                        <span className="truncate">{visit.plaque.location}</span>
                      </>
                    )}
                  </div>
                  {visit.notes && (
                    <div className="mt-1">
                      <Badge variant="outline" className="text-xs bg-blue-50">
                        Has notes
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  <Clock size={12} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {visits.length > 4 && (
        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={onViewAll} className="gap-2">
            View All {visits.length} Visits
            <ArrowRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default VisitsSection;