import React from 'react';
import { 
  ArrowLeft, PenLine, X, CheckCircle, Share2, 
  MoreHorizontal, Edit, Star, Trash, Clock, Eye, EyeOff,
  Download, User
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CollectionDetailHeaderProps = {
  collection: any;
  isEditingName: boolean;
  editNameValue: string;
  onEditNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditName: () => void;
  onBackToCollections: () => void;
  getUpdatedText: (timestamp: string) => string;
};

const CollectionDetailHeader = ({
  collection,
  isEditingName,
  editNameValue,
  onEditNameChange,
  onSaveEdit,
  onCancelEdit,
  onEditName,
  onBackToCollections,
  getUpdatedText
}: CollectionDetailHeaderProps) => {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={onBackToCollections} className="h-8 w-8">
          <ArrowLeft size={18} />
        </Button>
        <a href="/collections" className="text-gray-500 hover:text-blue-600 text-sm">
          Collections
        </a>
        <span className="text-gray-400">/</span>
      </div>
      
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl ${collection.color}`}>
            {collection.icon}
          </div>
          
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={editNameValue}
                onChange={onEditNameChange}
                className="text-xl font-bold py-1 h-auto"
                autoFocus
              />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onSaveEdit} 
                className="h-8 w-8 text-green-600"
              >
                <CheckCircle size={18} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onCancelEdit} 
                className="h-8 w-8 text-red-600"
              >
                <X size={18} />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{collection.name}</h1>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onEditName} 
                className="h-8 w-8"
              >
                <PenLine size={16} />
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Share2 size={16} className="mr-2" /> Share
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Share Collection</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User size={16} className="mr-2" /> Share with friends
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download size={16} className="mr-2" /> Export as PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Eye size={16} className="mr-2" /> Make Public
              </DropdownMenuItem>
              <DropdownMenuItem>
                <EyeOff size={16} className="mr-2" /> Make Private
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit size={16} className="mr-2" /> Edit Collection
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Star 
                  size={16} 
                  className={`mr-2 ${collection.is_favorite ? "text-amber-500 fill-amber-500" : ""}`} 
                /> 
                {collection.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash size={16} className="mr-2" /> Delete Collection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-3 mt-3">
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock size={12} /> Updated {getUpdatedText(collection.updated_at)}
        </Badge>
        <Badge variant="outline">
          {collection.plaques.length} plaques
        </Badge>
        {collection.is_public && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Eye size={12} className="mr-1" /> Public
          </Badge>
        )}
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