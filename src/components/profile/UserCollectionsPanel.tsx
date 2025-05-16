// src/components/profile/UserCollectionsPanel.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { List, Plus, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CollectionData {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  plaques: number[];
  is_favorite: boolean;
  is_public: boolean;
  created_at: any;
  updated_at: any;
}

interface UserCollectionsPanelProps {
  collections: CollectionData[];
  showFavoritesOnly?: boolean;
  showAll?: () => void;
}

const UserCollectionsPanel: React.FC<UserCollectionsPanelProps> = ({
  collections,
  showFavoritesOnly = false,
  showAll
}) => {
  const navigate = useNavigate();

  // Apply styles for collection color
  const getColorStyles = (color: string) => {
    const colorMap: Record<string, string> = {
      'blue': 'bg-blue-500',
      'green': 'bg-green-500',
      'red': 'bg-red-500',
      'purple': 'bg-purple-500',
      'pink': 'bg-pink-500',
      'yellow': 'bg-yellow-500',
      'orange': 'bg-orange-500',
      'gray': 'bg-gray-500',
      'indigo': 'bg-indigo-500'
    };
    
    return colorMap[color] || 'bg-blue-500';
  };

  return (
    <div className="bg-white shadow-sm rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <List className="text-gray-500" size={18} />
          {showFavoritesOnly ? 'Favorite Collections' : 'My Collections'}
        </h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/collections/new')}
          className="gap-1"
        >
          <Plus size={14} />
          New
        </Button>
      </div>
      
      {collections.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <List className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-gray-600">No collections yet</h4>
          <p className="text-gray-500 mb-4">Start organizing your plaques into collections</p>
          <Button 
            onClick={() => navigate('/collections/new')}
            size="sm"
            className="gap-1"
          >
            <Plus size={14} />
            Create Collection
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {collections.map(collection => (
            <div 
              key={collection.id}
              className="border rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/collections/${collection.id}`)}
            >
              <div className="flex items-center gap-3">
                <div className={`${getColorStyles(collection.color)} text-white w-10 h-10 flex items-center justify-center rounded-lg`}>
                  {collection.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{collection.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {collection.plaques.length} {collection.plaques.length === 1 ? 'plaque' : 'plaques'}
                    </span>
                    {collection.is_favorite && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs px-1.5">
                        Favorite
                      </Badge>
                    )}
                    {collection.is_public && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs px-1.5">
                        Public
                      </Badge>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </div>
          ))}
          
          {showAll && (
            <Button
              variant="ghost"
              className="w-full justify-center text-sm text-gray-600 hover:text-blue-600"
              onClick={showAll}
            >
              View All Collections
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default UserCollectionsPanel;