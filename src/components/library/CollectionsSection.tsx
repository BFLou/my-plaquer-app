// src/components/library/CollectionsSection.tsx (Mobile Enhanced)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderOpen, 
  Plus, 
  ArrowRight, 
  Star,
  MapPin,
  MoreHorizontal
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTimeAgo } from '@/utils/timeUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <FolderOpen className="text-purple-500" size={20} />
          <div>
            <h2 className="text-lg sm:text-xl font-bold">Collections</h2>
            <p className="text-xs sm:text-sm text-gray-500">
              {collections.length} collection{collections.length !== 1 ? 's' : ''} created
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onCreateNew}
            className="gap-1 h-8 sm:h-10"
          >
            <Plus size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">New Collection</span>
            <span className="sm:hidden">New</span>
          </Button>
          {collections.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onViewAll}
              className="gap-1 h-8 sm:h-10"
            >
              <span className="hidden sm:inline">View All</span>
              <span className="sm:hidden">All</span>
              <ArrowRight size={14} className="sm:w-4 sm:h-4" />
            </Button>
          )}
        </div>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
          <FolderOpen className="mx-auto text-gray-300 mb-3" size={40} />
          <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-2">No Collections Yet</h3>
          <p className="text-sm text-gray-500 mb-4 sm:mb-6 max-w-md mx-auto px-4">
            Start organizing your favorite plaques into themed collections
          </p>
          <Button onClick={onCreateNew} className="gap-2 h-10 sm:h-12">
            <Plus size={16} />
            Create Your First Collection
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {recentCollections.map(collection => (
            <div 
              key={collection.id}
              className="border rounded-lg p-3 sm:p-4 hover:shadow-md cursor-pointer transition-all group bg-white"
              onClick={() => handleCollectionClick(collection.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-white text-lg sm:text-xl ${collection.color} flex-shrink-0`}>
                  {collection.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors truncate text-sm sm:text-base">
                        {collection.name}
                      </h3>
                      {collection.is_favorite && (
                        <Star size={12} className="fill-amber-400 text-amber-400 flex-shrink-0" />
                      )}
                    </div>
                    
                    {/* Mobile menu - only show on mobile */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity sm:hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleCollectionClick(collection.id);
                        }}>
                          View Collection
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {collection.description && (
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2">
                      {collection.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Badge variant="outline" className="flex items-center gap-1 bg-gray-50 text-xs">
                        <MapPin size={10} />
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
          <Button variant="ghost" onClick={onViewAll} className="gap-2 h-10">
            View All {collections.length} Collections
            <ArrowRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default CollectionsSection;