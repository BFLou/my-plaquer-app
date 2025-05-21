// src/components/plaques/PlaqueCard.tsx - Updated sections
import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Star, CheckCircle, MoreVertical, Trash2, Plus, Calendar, Edit, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plaque } from '@/types/plaque';
import PlaqueImage from './PlaqueImage'; 
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { useFavorites } from '@/hooks/useFavorites';
import AddToCollectionDialog from './AddToCollectionDialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

type PlaqueCardProps = {
  plaque: Plaque;
  isSelected?: boolean;
  onSelect?: (id: number) => void;
  onMarkVisited?: (id: number) => void;
  onRemovePlaque?: (id: number) => void;
  onClick?: (plaque: Plaque) => void;
  showCollectionActions?: boolean;
  showSelection?: boolean;
  variant?: 'discover' | 'collection';
  className?: string;
};

export const PlaqueCard = ({
  plaque,
  isSelected = false,
  onSelect,
  onMarkVisited,
  onRemovePlaque,
  onClick,
  showCollectionActions = false,
  showSelection = false,
  variant = 'discover',
  className = ''
}: PlaqueCardProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddToCollection, setShowAddToCollection] = useState(false);
  const [showVisitDialog, setShowVisitDialog] = useState(false);
  const [showEditVisitDialog, setShowEditVisitDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [visitDate, setVisitDate] = useState<Date>(new Date());
  const [visitNotes, setVisitNotes] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Use hooks for consistent state management
  const { isPlaqueVisited, markAsVisited, removeVisit, getVisitInfo, updateVisit } = useVisitedPlaques();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  // Determine if the plaque is visited and get visit info
  const isVisited = plaque.visited || isPlaqueVisited(plaque.id);
  const isFav = isFavorite(plaque.id);
  const visitInfo = getVisitInfo(plaque.id);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleClick = () => {
    if (onClick) onClick(plaque);
  };

  const handleMarkVisited = async () => {
    setShowVisitDialog(true);
    setShowDropdown(false);
  };

  const handleConfirmVisit = async () => {
    setIsProcessing(true);
    try {
      await markAsVisited(plaque.id, {
        visitedAt: visitDate.toISOString(),
        notes: visitNotes,
      });
      
      if (onMarkVisited) onMarkVisited(plaque.id);
      toast.success("Marked as visited");
      setShowVisitDialog(false);
      setVisitNotes('');
      setVisitDate(new Date());
    } catch (error) {
      console.error("Error marking as visited:", error);
      toast.error("Failed to mark as visited");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditVisit = () => {
    if (visitInfo) {
      setVisitDate(visitInfo.visited_at.toDate ? visitInfo.visited_at.toDate() : new Date(visitInfo.visited_at));
      setVisitNotes(visitInfo.notes || '');
      setShowEditVisitDialog(true);
    }
    setShowDropdown(false);
  };

  const handleUpdateVisit = async () => {
    if (!visitInfo) return;
    
    setIsProcessing(true);
    try {
      await updateVisit(visitInfo.id, {
        visitedAt: visitDate.toISOString(),
        notes: visitNotes,
      });
      
      toast.success("Visit updated");
      setShowEditVisitDialog(false);
    } catch (error) {
      console.error("Error updating visit:", error);
      toast.error("Failed to update visit");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteVisit = async () => {
    if (!visitInfo) return;
    
    setIsProcessing(true);
    try {
      await removeVisit(visitInfo.id);
      toast.success("Visit deleted");
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting visit:", error);
      toast.error("Failed to delete visit");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(plaque.id);
    setShowDropdown(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemovePlaque) onRemovePlaque(plaque.id);
    setShowDropdown(false);
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) onSelect(plaque.id);
  };

  const handleAddToCollection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAddToCollection(true);
    setShowDropdown(false);
  };

  // Handle color for display (merging color and colour fields)
  const plaqueColor = plaque.color || plaque.colour || 'unknown';
  
  // Handle location display (address or custom formatted location)
  const locationDisplay = plaque.location || plaque.address || '';

  // Image source with fallback
  const imageUrl = plaque.image || plaque.main_photo;

  return (
    <Card 
      className={`overflow-hidden hover:shadow-md transition-shadow cursor-pointer group relative h-full ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${className}`}
      onClick={handleClick}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-0 left-0 w-full h-full ring-2 ring-blue-500 rounded-lg z-10 pointer-events-none"></div>
      )}
      
      {/* Image container with responsive height */}
      <div className="relative h-32 sm:h-40 bg-blue-50">
        <PlaqueImage 
          src={imageUrl}
          alt={plaque.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          placeholderClassName="bg-blue-50"
          plaqueColor={plaqueColor}
        />
        
        {/* Corner Action Menu */}
        <div className="absolute top-2 right-2 z-20" ref={dropdownRef}>
          <button 
            className="h-8 w-8 rounded-full bg-black/30 hover:bg-black/40 text-white flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
          >
            <MoreVertical size={16} />
          </button>
          
          {showDropdown && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-30 border">
              {/* Mark as Visited or Edit Visit */}
              {!isVisited ? (
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkVisited();
                  }}
                >
                  <CheckCircle size={14} className="mr-2 text-green-600" />
                  Mark as visited
                </button>
              ) : (
                <>
                  <button 
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditVisit();
                    }}
                  >
                    <Edit size={14} className="mr-2 text-blue-600" />
                    Edit visit
                  </button>
                  <button 
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                      setShowDropdown(false);
                    }}
                  >
                    <X size={14} className="mr-2" />
                    Delete visit
                  </button>
                </>
              )}
              
              {/* Favorite */}
              <button 
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                onClick={handleFavoriteToggle}
              >
                <Star size={14} className={`mr-2 ${isFav ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`} />
                {isFav ? 'Remove from favorites' : 'Add to favorites'}
              </button>

              {/* Add to Collection (only in discover mode) */}
              {variant === 'discover' && (
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  onClick={handleAddToCollection}
                >
                  <Plus size={14} className="mr-2 text-blue-600" />
                  Add to collection
                </button>
              )}
              
              {/* Remove from Collection (only in collection mode) */}
              {variant === 'collection' && onRemovePlaque && (
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                  onClick={handleRemove}
                >
                  <Trash2 size={14} className="mr-2" />
                  Remove from collection
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Status badges - repositioned for mobile */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isVisited && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
              <CheckCircle size={10} className="mr-1" /> 
              {visitInfo && format(
                visitInfo.visited_at.toDate ? visitInfo.visited_at.toDate() : new Date(visitInfo.visited_at), 
                'MMM d'
              )}
            </Badge>
          )}
          {isFav && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
              <Star size={10} className="mr-1 fill-amber-600" /> Favorite
            </Badge>
          )}
          {isSelected && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
              <CheckCircle size={10} className="mr-1" /> Selected
            </Badge>
          )}
        </div>
      </div>
      
      <CardHeader className="pb-2 px-3 sm:px-6">
        <CardTitle className="text-base sm:text-lg font-bold group-hover:text-blue-600 transition-colors line-clamp-2">
          {plaque.title}
        </CardTitle>
        <CardDescription className="flex items-start text-gray-500 text-sm">
          <MapPin size={12} className="mr-1 mt-0.5 shrink-0" /> 
          <span className="line-clamp-2">{locationDisplay}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0 px-3 sm:px-6 pb-3">
        <div className="flex flex-wrap gap-1 mb-3">
          {plaqueColor && plaqueColor !== "Unknown" && (
            <Badge 
              variant="outline" 
              className={`text-xs
                ${plaqueColor === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                ${plaqueColor === 'green' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                ${plaqueColor === 'brown' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                ${plaqueColor === 'black' ? 'bg-gray-100 text-gray-700 border-gray-300' : ''}
                ${plaqueColor === 'grey' ? 'bg-gray-100 text-gray-700 border-gray-300' : ''}
              `}
            >
              {plaqueColor.charAt(0).toUpperCase() + plaqueColor.slice(1)} Plaque
            </Badge>
          )}
          
          {plaque.lead_subject_primary_role && plaque.lead_subject_primary_role !== "Unknown" && (
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
              {(plaque.lead_subject_primary_role as string).charAt(0).toUpperCase() + 
               (plaque.lead_subject_primary_role as string).slice(1)}
            </Badge>
          )}
        </div>
        
        {/* Short description preview with line clamping */}
        {plaque.inscription && (
          <p className="mt-2 text-xs sm:text-sm text-gray-600 line-clamp-2">
            {plaque.inscription}
          </p>
        )}
        
        {/* Selection checkbox - only show when needed */}
        {showSelection && onSelect && (
          <div className="mt-3 flex items-center">
            <label className="flex items-center cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleSelectClick}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-600">Select</span>
            </label>
          </div>
        )}

        {/* Mobile-friendly action buttons */}
        <div className="mt-3 flex gap-2 sm:hidden">
          {!isVisited ? (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleMarkVisited();
              }}
            >
              <CheckCircle size={12} className="mr-1" />
              Visit
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleEditVisit();
              }}
            >
              <Edit size={12} className="mr-1" />
              Edit
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={handleFavoriteToggle}
          >
            <Star size={12} className={`mr-1 ${isFav ? 'fill-amber-500 text-amber-500' : ''}`} />
            {isFav ? 'Unfav' : 'Fav'}
          </Button>
        </div>
      </CardContent>

      {/* Add to Collection Dialog */}
      <AddToCollectionDialog
        isOpen={showAddToCollection}
        onClose={() => setShowAddToCollection(false)}
        plaque={plaque}
      />

      {/* Visit Dialog */}
      <Dialog open={showVisitDialog} onOpenChange={setShowVisitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Visited</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Visit Date</label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(visitDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={visitDate}
                    onSelect={(date) => {
                      if (date) {
                        setVisitDate(date);
                        setShowCalendar(false);
                      }
                    }}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                placeholder="Any thoughts about your visit?"
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowVisitDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmVisit}
              disabled={isProcessing}
            >
              {isProcessing ? 'Saving...' : 'Mark as Visited'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Visit Dialog */}
      <Dialog open={showEditVisitDialog} onOpenChange={setShowEditVisitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Visit</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Visit Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(visitDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={visitDate}
                    onSelect={(date) => date && setVisitDate(date)}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                placeholder="Any thoughts about your visit?"
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditVisitDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateVisit}
              disabled={isProcessing}
            >
              {isProcessing ? 'Updating...' : 'Update Visit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Visit Confirmation */}
{/* Delete Visit Confirmation */}
     <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle>Delete Visit</DialogTitle>
         </DialogHeader>
         
         <div className="py-4">
           <p className="text-sm text-gray-600">
             Are you sure you want to delete your visit to this plaque? This action cannot be undone.
           </p>
         </div>
         
         <DialogFooter>
           <Button
             variant="outline"
             onClick={() => setShowDeleteConfirm(false)}
             disabled={isProcessing}
           >
             Cancel
           </Button>
           <Button 
             variant="destructive"
             onClick={handleDeleteVisit}
             disabled={isProcessing}
           >
             {isProcessing ? 'Deleting...' : 'Delete Visit'}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   </Card>
 );
};

export default PlaqueCard;