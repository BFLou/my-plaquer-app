// src/components/collections/CollectionDetailHeader.jsx
import React, { useState } from 'react';
import { 
  ArrowLeft, Star, Pencil, MoreHorizontal, 
  Copy, Trash2, Clock, X, Check
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
import { formatTimeAgo } from '@/utils/timeUtils';

const CollectionDetailHeader = ({
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
    <div className={`relative bg-gradient-to-br from-blue-600 to-blue-700 text-white py-4 px-4 overflow-hidden ${className}`}>
      {/* Decorative background elements - made smaller */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-8 w-24 h-24 rounded-full bg-white"></div>
        <div className="absolute bottom-6 right-14 w-32 h-32 rounded-full bg-white"></div>
        <div className="absolute top-16 right-20 w-12 h-12 rounded-full bg-white"></div>
      </div>
      
      <div className="container mx-auto max-w-5xl relative z-10">
        {/* Breadcrumb - made smaller and inline with title */}
        <div className="flex items-center mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack} 
            className="h-7 w-7 p-0 bg-white/20 text-white hover:bg-white/30 mr-1"
          >
            <ArrowLeft size={16} />
          </Button>
          <a 
            className="text-white/80 hover:text-white text-xs cursor-pointer" 
            onClick={onBack}
          >
            Collections
          </a>
          <span className="text-white/50 mx-1">/</span>
        </div>
        
        {/* Main header content - more compact with flexible layout */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left side: icon and title */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xl ${collection.color} shadow-md`}>
              {collection.icon}
            </div>
            
            {editNameMode ? (
              <div className="flex items-center gap-1">
                <Input
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  className="bg-white/10 text-white text-lg font-bold h-8 py-1 px-2 rounded border border-white/20 backdrop-blur-sm w-72"
                  disabled={isLoading}
                  autoFocus
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSaveName} 
                  className="h-7 w-7 p-0 text-green-300 bg-white/10 hover:bg-white/20"
                  disabled={isLoading}
                >
                  <Check size={16} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCancelEdit} 
                  className="h-7 w-7 p-0 text-red-300 bg-white/10 hover:bg-white/20"
                  disabled={isLoading}
                >
                  <X size={16} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-bold">{collection.name}</h1>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onEdit} 
                  className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10"
                >
                  <Pencil size={14} />
                </Button>
              </div>
            )}
          </div>
          
          {/* Right side: actions */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 ml-0.5">
              <Badge variant="outline" className="text-xs bg-white/10 text-white border-white/20 py-0.5">
                <Clock size={10} className="mr-1" /> {formatTimeAgo(collection.updated_at)}
              </Badge>
              <Badge variant="outline" className="text-xs bg-white/10 text-white border-white/20 py-0.5">
                {plaqueCount} {plaqueCount === 1 ? 'plaque' : 'plaques'}
              </Badge>
            </div>
            
            {/* Favorite button with improved styling */}
            <Button 
              variant={collection.is_favorite ? "default" : "outline"}
              size="sm"
              onClick={onToggleFavorite}
              className={collection.is_favorite 
                ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-400" 
                : "bg-white/10 hover:bg-white/20 text-white border-white/20"}
              disabled={isLoading}
            >
              <Star 
                size={14} 
                className={`mr-1 ${collection.is_favorite ? "fill-white" : ""}`} 
              />
              {collection.is_favorite ? "Favorited" : "Favorite"}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 p-2 bg-white/10 text-white border-white/20 hover:bg-white/20" 
                  disabled={isLoading}
                >
                  <Pencil size={14} className="mr-1" />
                  Edit
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit()}>
                  <Pencil size={14} className="mr-2" /> Edit Collection
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate()}>
                  <Copy size={14} className="mr-2" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600" 
                  onClick={() => onDelete()}
                >
                  <Trash2 size={14} className="mr-2" /> Delete Collection
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Description - only show if present */}
        {collection.description && (
          <p className="text-white/80 mt-2 text-sm max-w-3xl">{collection.description}</p>
        )}
      </div>
    </div>
  );
};

export default CollectionDetailHeader;