// src/components/profile/VisitedPlaquesPanel.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface VisitData {
  id: string;
  plaque_id: number;
  visited_at: any;
  notes?: string;
  photo_url?: string;
  user_id: string;
}

interface PlaqueData {
  id: number;
  title: string;
  location?: string;
  // Other plaque properties as needed
}

interface VisitedPlaquesPanelProps {
  visits: VisitData[];
  plaques?: Record<number, PlaqueData>; // Optional map of plaque data
  showAll?: () => void;
}

const VisitedPlaquesPanel: React.FC<VisitedPlaquesPanelProps> = ({
  visits,
  plaques = {},
  showAll
}) => {
  const navigate = useNavigate();

  // Format date nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get time ago string
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="bg-white shadow-sm rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <MapPin className="text-blue-500" size={18} />
          Recent Visits
        </h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/discover')}
        >
          Discover More
        </Button>
      </div>
      
      {visits.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-gray-600">No visits yet</h4>
          <p className="text-gray-500 mb-4">Start exploring and visiting plaques</p>
          <Button 
            onClick={() => navigate('/discover')}
            size="sm"
          >
            Discover Plaques
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map(visit => {
            const plaque = plaques[visit.plaque_id];
            
            return (
              <div 
                key={visit.id}
                className="border rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/discover/plaque/${visit.plaque_id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-500 w-10 h-10 flex items-center justify-center rounded-lg">
                    <MapPin size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">
                      {plaque ? plaque.title : `Plaque #${visit.plaque_id}`}
                    </h4>
                    <div className="flex items-center text-xs text-gray-500 gap-1.5">
                      <Calendar size={12} />
                      <span>Visited {getTimeAgo(visit.visited_at)}</span>
                      <span className="text-gray-400">•</span>
                      <span>{formatDate(visit.visited_at)}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
            );
          })}
          
          {showAll && visits.length > 0 && (
            <Button
              variant="ghost"
              className="w-full justify-center text-sm text-gray-600 hover:text-blue-600"
              onClick={showAll}
            >
              View All Visits
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default VisitedPlaquesPanel;