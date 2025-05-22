// src/components/library/CollectionsSection.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderOpen, 
  Plus, 
  ArrowRight, 
  Star,
  MapPin
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTimeAgo } from '@/utils/timeUtils';

interface CollectionsSectionProps {
  collections: any[];
  onViewAll: () => void;
  onCreateNew: () => void;
}

const CollectionsSection: React.FC<CollectionsSectionProps> = ({
  collections,
  onViewAll,
  onCreateNew
}) => {
  const navigate = useNavigate();

  // Get recent collections (up to 4)
  const recentCollections = [...collections]
    .sort((a, b) => {
      const dateA = a.updated_at?.toDate ? a.updated_at.toDate() : new Date(a.updated_at);
      const dateB = b.updated_at?.toDate ? b.updated_at.toDate() : new Date(b.updated_at);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 4);

  const handleCollectionClick = (collectionId: string) => {
    navigate(`/library/collections/${collectionId}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FolderOpen className="text-purple-500" size={24} />
          <div>
            <h2 className="text-xl font-bold">Collections</h2>
            <p className="text-sm text-gray-500">
              {collections.length} collection{collections.length !== 1 ? 's' : ''} created
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onCreateNew}
            className="gap-1"
          >
            <Plus size={16} />
            New Collection
          </Button>
          {collections.length > 0 && (
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

      {collections.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FolderOpen className="mx-auto text-gray-300 mb-3" size={48} />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Collections Yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Start organizing your favorite plaques into themed collections
          </p>
          <Button onClick={onCreateNew} className="gap-2">
            <Plus size={16} />
            Create Your First Collection
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentCollections.map(collection => (
            <div 
              key={collection.id}
              className="border rounded-lg p-4 hover:shadow-md cursor-pointer transition-all group"
              onClick={() => handleCollectionClick(collection.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl ${collection.color} flex-shrink-0`}>
                  {collection.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors truncate">
                      {collection.name}
                    </h3>
                    {collection.is_favorite && (
                      <Star size={14} className="fill-amber-400 text-amber-400 flex-shrink-0" />
                    )}
                  </div>
                  {collection.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {collection.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="flex items-center gap-1 bg-gray-50">
                        <MapPin size={12} />
                        {Array.isArray(collection.plaques) ? collection.plaques.length : collection.plaques || 0}
                      </Badge>
                      {collection.is_public && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                          Public
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(collection.updated_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {collections.length > 4 && (
        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={onViewAll} className="gap-2">
            View All {collections.length} Collections
            <ArrowRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default CollectionsSection;