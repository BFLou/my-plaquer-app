import { MapPin, Star, List, Book, Eye, ChevronRight, SlidersHorizontal, Clock } from 'lucide-react';
import { StatCard } from '@/components';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collection } from '@/components/collections/CollectionCard';

type CollectionsDashboardProps = {
  collections: Collection[];
  onCreateCollection: () => void;
  onViewAllFavorites: () => void;
  onOpenFilters: () => void;
  className?: string;
};

export const CollectionsDashboard = ({
  collections,
  onCreateCollection,
  onViewAllFavorites,
  onOpenFilters,
  className = ''
}: CollectionsDashboardProps) => {
  // Calculate statistics
  const totalCollections = collections.length;
  const totalPlaques = collections.reduce((sum, c) => sum + c.plaques, 0);
  const favoriteCollections = collections.filter(c => c.isFavorite).length;
  const publicCollections = collections.filter(c => c.isPublic).length;
  const privateCollections = collections.filter(c => !c.isPublic).length;
  
  // Find most recently updated collection
  const recentCollection = collections.sort((a, b) => 
    a.updated.includes('just now') ? -1 : 
    b.updated.includes('just now') ? 1 : 
    a.updated.includes('today') ? -1 : 
    b.updated.includes('today') ? 1 : 
    a.updated.includes('yesterday') ? -1 : 
    b.updated.includes('yesterday') ? 1 : 0
  )[0];
  
  // Get collection with most plaques
  const largestCollection = [...collections].sort((a, b) => b.plaques - a.plaques)[0];

  return (
    <div className={`${className}`}>
      {/* Top Statistics Section */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard 
          label="Total Collections" 
          value={totalCollections} 
          icon={<List size={20} className="text-blue-500" />} 
        />
        <StatCard 
          label="Total Plaques" 
          value={totalPlaques} 
          icon={<MapPin size={20} className="text-blue-500" />} 
        />
        <StatCard 
          label="Favorite Collections" 
          value={favoriteCollections} 
          icon={<Star size={20} className="text-amber-500" />} 
        />
        <StatCard 
          label="Public Collections" 
          value={publicCollections} 
          subValue={`${privateCollections} private`}
          icon={<Eye size={20} className="text-green-500" />} 
        />
      </div>
      
      {/* Quick Access & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Create New Collection Card */}
        <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Create Collection</h3>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <List size={18} className="text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Build a new curated collection of historical plaques.
          </p>
          <Button 
            onClick={onCreateCollection}
            className="mt-auto"
          >
            Create New Collection
          </Button>
        </div>
        
        {/* Quick Filters Card */}
        <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Filter & Sort</h3>
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <SlidersHorizontal size={18} className="text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Refine your collections by type, size, or favorites status.
          </p>
          <Button 
            variant="outline"
            onClick={onOpenFilters}
            className="mt-auto"
          >
            Open Filters
          </Button>
        </div>
        
        {/* Favorites Preview Card */}
        <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Favorites</h3>
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Star size={18} className="text-amber-500" />
            </div>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {favoriteCollections === 0 ? (
              <span className="text-sm text-gray-500">No favorite collections yet</span>
            ) : (
              <>
                <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
                  {favoriteCollections} favorites
                </Badge>
                {collections.filter(c => c.isFavorite).slice(0, 2).map(collection => (
                  <Badge key={collection.id} className="bg-white border">
                    {collection.name}
                  </Badge>
                ))}
                {favoriteCollections > 2 && (
                  <Badge variant="outline">
                    +{favoriteCollections - 2} more
                  </Badge>
                )}
              </>
            )}
          </div>
          <Button 
            variant="outline"
            onClick={onViewAllFavorites}
            className="mt-auto flex items-center gap-1"
            disabled={favoriteCollections === 0}
          >
            View All Favorites
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
      
      {/* Insights Section */}
      {collections.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Collection Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Latest Activity */}
            {recentCollection && (
              <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center">
                  <Clock size={18} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Latest Activity</h4>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{recentCollection.name}</span> was updated {recentCollection.updated}
                  </p>
                </div>
              </div>
            )}
            
            {/* Largest Collection */}
            {largestCollection && (
              <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
                <div className="w-10 h-10 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center">
                  <Book size={18} className="text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Largest Collection</h4>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{largestCollection.name}</span> with {largestCollection.plaques} plaques
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionsDashboard;