// src/components/profile/VisitedPlaquesPanel.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, Star, Calendar, Image } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import userData from '../../data/user_data.json';

type VisitedPlaquesPanelProps = {
  limit?: number;
  showViewAll?: boolean;
  className?: string;
};

const VisitedPlaquesPanel: React.FC<VisitedPlaquesPanelProps> = ({ 
  limit = 5,
  showViewAll = true,
  className = ''
}) => {
  const navigate = useNavigate();
  
  // Get visits directly from user_data.json
  const visitedPlaques = userData.visited_plaques;
  
  // Sort by most recent first
  const sortedVisits = [...visitedPlaques]
    .sort((a, b) => new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime())
    .slice(0, limit);
  
  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    }).format(date);
  };
  
  // Navigate to all visits
  const handleViewAll = () => {
    navigate('/profile/visits');
  };

  // Generate a color based on plaque ID for visual variety
  const getColorForPlaque = (id: number) => {
    const colors = [
      'bg-blue-100 text-blue-500',
      'bg-green-100 text-green-500',
      'bg-purple-100 text-purple-500',
      'bg-amber-100 text-amber-500',
      'bg-rose-100 text-rose-500',
      'bg-teal-100 text-teal-500'
    ];
    return colors[id % colors.length];
  };
  
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold">Recent Visits</h2>
        {showViewAll && (
          <Button variant="ghost" size="sm" onClick={handleViewAll} className="flex items-center gap-1">
            View All <ArrowRight size={16} />
          </Button>
        )}
      </div>
      
      {sortedVisits.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <MapPin className="mx-auto text-gray-400 mb-2" size={32} />
          <h3 className="text-lg font-medium text-gray-700 mb-1">No Visits Yet</h3>
          <p className="text-gray-500 mb-3">You haven't recorded any plaque visits.</p>
          <Button onClick={() => navigate('/discover')}>Discover Plaques</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedVisits.map((visit) => {
            const colorClass = getColorForPlaque(visit.plaque_id);
            const hasPhotos = visit.photos && visit.photos.length > 0;
            const visitedAt = formatDate(visit.visited_at);
            
            return (
              <div key={`${visit.plaque_id}-${visit.visited_at}`} className="flex gap-3 border-b pb-4 last:border-0">
                <div className="shrink-0 w-16 h-16 rounded-md overflow-hidden">
                  {hasPhotos ? (
                    <div className="relative w-full h-full bg-gray-100">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Image size={24} className="text-gray-400" />
                      </div>
                    </div>
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${colorClass}`}>
                      <MapPin size={24} />
                    </div>
                  )}
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium truncate mr-2">
                      {`Plaque #${visit.plaque_id}`}
                    </h3>
                  </div>
                  
                  <p className="text-sm text-gray-500 truncate">{visit.notes || "No notes available"}</p>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-600 border-green-200">
                      <Calendar size={12} /> {visitedAt}
                    </Badge>
                    
                    {visit.rating > 0 && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        {'★'.repeat(visit.rating)}{'☆'.repeat(5-visit.rating)}
                      </Badge>
                    )}
                    
                    {hasPhotos && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Image size={12} /> {visit.photos.length} photo{visit.photos.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VisitedPlaquesPanel;