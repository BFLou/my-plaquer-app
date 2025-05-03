// src/components/profile/UserCollectionsPanel.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Star, BookOpen } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import userData from '../../data/user_data.json';

type UserCollectionsPanelProps = {
  limit?: number;
  showFavoritesOnly?: boolean;
  showViewAll?: boolean;
  className?: string;
};

const UserCollectionsPanel: React.FC<UserCollectionsPanelProps> = ({ 
  limit = 4,
  showFavoritesOnly = false,
  showViewAll = true,
  className = ''
}) => {
  const navigate = useNavigate();
  
  // Get collections directly from user_data.json
  const collections = userData.collections;
  
  // Apply filters
  const filteredCollections = collections
    .filter(c => showFavoritesOnly ? c.is_favorite : true)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, limit);
  
  // Format date
  const formatUpdateText = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'today';
    } else if (diffInDays === 1) {
      return 'yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      const months = Math.floor(diffInDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
  };
  
  // Navigate to all collections
  const handleViewAll = () => {
    navigate('/collections');
  };
  
  // Navigate to collection detail
  const handleViewCollection = (id: number) => {
    navigate(`/collections/${id}`);
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <CardTitle>{showFavoritesOnly ? 'Favorite Collections' : 'My Collections'}</CardTitle>
          {showViewAll && (
            <Button variant="ghost" size="sm" onClick={handleViewAll} className="flex items-center gap-1">
              View All <ArrowRight size={16} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {filteredCollections.length === 0 ? (
          <div className="text-center py-4 bg-gray-50 rounded-lg">
            <BookOpen className="mx-auto text-gray-400 mb-2" size={24} />
            <p className="text-gray-500">
              {showFavoritesOnly ? 'No favorite collections yet' : 'No collections yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCollections.map(collection => (
              <div 
                key={collection.id} 
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleViewCollection(collection.id)}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${collection.color}`}>
                  <span className="text-lg">{collection.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{collection.name}</h3>
                  <p className="text-xs text-gray-500">
                    {collection.plaques.length} plaques • Updated {formatUpdateText(collection.updated_at)}
                  </p>
                </div>
                {collection.is_favorite && (
                  <Star size={16} className="text-amber-500 fill-amber-500" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserCollectionsPanel;