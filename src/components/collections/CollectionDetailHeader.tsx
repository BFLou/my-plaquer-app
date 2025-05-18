// src/features/collections/components/CollectionDetailHeader.tsx
import React, { useState } from 'react';
import { 
  ArrowLeft, Star, Pencil, MoreHorizontal, 
  Copy, Trash2, Clock, Eye, X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collection } from './CollectionCard';
import { formatTimeAgo } from '../../utils/collectionHelpers';

type CollectionDetailHeaderProps = {
  collection: Collection;
  onBack: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onUpdateName: (name: string) => void;
  isLoading: boolean;
  className?: string;
};

const CollectionDetailHeader: React.FC<CollectionDetailHeaderProps> = ({
  collection,
  onBack,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  onUpdateName,
  isLoading,
  className = ''
}) => {
  const [editNameMode, setEditNameMode] = useState(false);
  const [editNameValue, setEditNameValue] = useState(collection.name);
  
  // Handle saving name
  const handleSaveName = () => {
    if (!editNameValue.trim() || editNameValue === collection.name) {
      setEditNameMode(false);
      return;
    }
    
    onUpdateName(editNameValue);
    setEditNameMode(false);
  };
  
  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditNameValue(collection.name);
    setEditNameMode(false);
  };
  
  // Get plaque count
  const plaqueCount = Array.isArray(collection.plaques) 
    ? collection.plaques.length 
    : collection.plaques;
  
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack} 
          className="h-8 w-8 p-0"
        >
          <ArrowLeft size={18} />
        </Button>
        <a 
          className="text-gray-500 hover:text-blue-600 text-sm cursor-pointer" 
          onClick={onBack}
        >
          Collections
        </a>
        <span className="text-gray-400">/</span>
      </div>
      
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-2xl ${collection.color}`}>
            {collection.icon}
          </div>
          
          {editNameMode ? (
            <div className="flex items-center gap-2">
              <Input
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                className="text-xl font-bold py-1 h-auto"
                disabled={isLoading}
                autoFocus
              />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSaveName} 
                className="h-8 w-8 p-0 text-green-600"
                disabled={isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCancelEdit} 
                className="h-8 w-8 p-0 text-red-600"
                disabled={isLoading}
              >
                <X size={18} />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{collection.name}</h1>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setEditNameMode(true)} 
                className="h-8 w-8 p-0"
              >
                <Pencil size={16} />
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={collection.is_favorite ? "outline" : "ghost"}
            size="sm"
            onClick={onToggleFavorite}
            className={collection.is_favorite ? "text-amber-500" : ""}
            disabled={isLoading}
          >
            <Star 
              size={16} 
              className={`mr-2 ${collection.is_favorite ? "fill-amber-500" : ""}`} 
            />
            {collection.is_favorite ? "Favorited" : "Favorite"}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0" disabled={isLoading}>
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil size={16} className="mr-2" /> Edit Collection
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy size={16} className="mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600" 
                onClick={onDelete}
              >
                <Trash2 size={16} className="mr-2" /> Delete Collection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-3 mt-3">
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock size={12} /> Updated {formatTimeAgo(collection.updated_at)}
        </Badge>
        <Badge variant="outline">
          {plaqueCount} {plaqueCount === 1 ? 'plaque' : 'plaques'}
        </Badge>
        {collection.is_favorite && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Star size={12} className="mr-1 fill-amber-500" /> Favorite
          </Badge>
        )}
      </div>
      
      {collection.description && (
        <p className="text-gray-600 mt-3">{collection.description}</p>
      )}
    </div>
  );
};

export default CollectionDetailHeader;