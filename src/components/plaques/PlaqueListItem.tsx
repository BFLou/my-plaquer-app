// src/components/plaques/PlaqueListItem.tsx - Improved to match PlaqueCard
import React, { useState } from 'react';
import { MapPin, Star, CheckCircle, MoreVertical, Trash2, Plus, Edit, X, Calendar } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plaque } from '@/types/plaque';
import PlaqueImage from './PlaqueImage';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { useFavorites } from '@/hooks/useFavorites';
import AddToCollectionDialog from './AddToCollectionDialog';
import EditVisitDialog from './EditVisitDialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type PlaqueListItemProps = {
  plaque: Plaque;
  isSelected?: boolean;
  onSelect?: (id: number) => void;
  onClick?: (plaque: Plaque) => void;
  onMarkVisited?: (id: number) => void;
  onRemovePlaque?: (id: number) => void;
  onAddToRoute?: (plaque: Plaque) => void;
  showSelection?: boolean;
  variant?: 'discover' | 'collection';
  className?: string;
};

export const PlaqueListItem = ({
  plaque,
  isSelected = false,
  onSelect,
  onClick,
  onMarkVisited,
  onRemovePlaque,
  onAddToRoute,
  showSelection = false,
  variant = 'discover',
  className = ''
}: PlaqueListItemProps) => {
  // State for various dialogs and actions
  const [showAddToCollection, setShowAddToCollection] = useState(false);
  const [showQuickVisitDialog, setShowQuickVisitDialog] = useState(false);
  const [showEditVisitDialog, setShowEditVisitDialog] = useState(false);
  const [showDeleteVisitConfirm, setShowDeleteVisitConfirm] = useState(false);
  
  // Quick visit form state
  const [visitDate, setVisitDate] = useState<Date>(new Date());
  const [visitNotes, setVisitNotes] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Use hooks for consistent state management
  const { isPlaqueVisited, markAsVisited, removeVisit, getVisitInfo } = useVisitedPlaques();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  // Determine if the plaque is visited and favorited
  const isVisited = plaque.visited || isPlaqueVisited(plaque.id);
  const isFav = isFavorite(plaque.id);
  const visitInfo = getVisitInfo(plaque.id);

  // Event handlers
  const handleClick = (e: React.MouseEvent) => {
    // Prevent click when interacting with buttons or dropdowns
    if (e.target instanceof Element && (
      e.target.closest('button') ||
      e.target.closest('[role="menuitem"]') ||
      e.target.closest('.dropdown-menu') ||
      e.target.closest('[data-radix-portal]')
    )) {
      return;
    }
    
    if (onClick) onClick(plaque);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(plaque.id);
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) onSelect(plaque.id);
  };

  const handleQuickMarkVisited = () => {
    setShowQuickVisitDialog(true);
  };

  const handleEditVisit = () => {
    setShowEditVisitDialog(true);
  };

  const handleDeleteVisit = () => {
    setShowDeleteVisitConfirm(true);
  };

  const handleRemove = () => {
    if (onRemovePlaque) onRemovePlaque(plaque.id);
  };

  const handleAddToCollection = () => {
    setShowAddToCollection(true);
  };

  const handleAddToRoute = () => {
    if (onAddToRoute) onAddToRoute(plaque);
  };

  // Quick visit form submission
  const handleQuickVisitSubmit = async () => {
    setIsProcessing(true);
    try {
      await markAsVisited(plaque.id, {
        visitedAt: visitDate.toISOString(),
        notes: visitNotes,
      });
      
      if (onMarkVisited) onMarkVisited(plaque.id);
      toast.success("Marked as visited");
      setShowQuickVisitDialog(false);
      setVisitNotes('');
      setVisitDate(new Date());
    } catch (error) {
      console.error("Error marking as visited:", error);
      toast.error("Failed to mark as visited");
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete visit confirmation
  const handleConfirmDeleteVisit = async () => {
    if (!visitInfo) return;
    
    setIsProcessing(true);
    try {
      await removeVisit(visitInfo.id);
      toast.success("Visit deleted");
      setShowDeleteVisitConfirm(false);
    } catch (error) {
      console.error("Error deleting visit:", error);
      toast.error("Failed to delete visit");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper functions for display
  const getLocationDisplay = () => plaque.location || plaque.address || '';
  const getPlaqueColor = () => plaque.color || plaque.colour || 'unknown';
  const getImageUrl = () => plaque.image || plaque.main_photo;

  const formatVisitDate = () => {
    if (!visitInfo?.visited_at) return '';
    try {
      const date = visitInfo.visited_at.toDate ? visitInfo.visited_at.toDate() : new Date(visitInfo.visited_at);
      return format(date, 'MMM d');
    } catch (error) {
      return 'Unknown date';
    }
  };

  return (
    <>
      <Card 
        className={`overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        } ${className}`}
        onClick={handleClick}
      >
        <div className="flex">
          {/* Image */}
          <div className="relative w-20 h-20 sm:w-32 sm:h-32 shrink-0">
            <PlaqueImage 
              src={getImageUrl()}
              alt={plaque.title} 
              className="w-full h-full object-cover"
              placeholderClassName="bg-blue-50"
              plaqueColor={getPlaqueColor()}
            />
          </div>
          
          {/* Content */}
          <div className="flex-grow p-3 sm:p-4 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <div className="min-w-0 flex-grow pr-2">
                <h3 className="font-semibold text-sm sm:text-base line-clamp-2 mb-1">
                  {plaque.title}
                </h3>
                <p className="text-gray-500 text-xs sm:text-sm flex items-start">
                  <MapPin size={12} className="mr-1 mt-0.5 shrink-0" /> 
                  <span className="line-clamp-2">{getLocationDisplay()}</span>
                </p>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* Mobile: Simple buttons */}
                <div className="flex sm:hidden gap-1">
                  {!isVisited && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-green-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickMarkVisited();
                      }}
                    >
                      <CheckCircle size={14} />
                    </Button>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`h-8 w-8 p-0 ${isFav ? 'text-amber-500' : 'text-gray-400'}`}
                    onClick={handleFavoriteClick}
                  >
                    <Star size={14} className={isFav ? 'fill-amber-500' : ''} />
                  </Button>
                </div>

                {/* Desktop: Dropdown menu */}
                <div className="hidden sm:flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`h-8 w-8 p-0 ${isFav ? 'text-amber-500' : 'text-gray-400'}`}
                    onClick={handleFavoriteClick}
                  >
                    <Star size={16} className={isFav ? 'fill-amber-500' : ''} />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* Visit actions */}
                      {!isVisited ? (
                        <DropdownMenuItem onSelect={handleQuickMarkVisited}>
                          <CheckCircle size={14} className="mr-2 text-green-600" />
                          Mark as visited
                        </DropdownMenuItem>
                      ) : (
                        <>
                          <DropdownMenuItem onSelect={handleEditVisit}>
                            <Edit size={14} className="mr-2 text-blue-600" />
                            Edit visit
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={handleDeleteVisit}>
                            <X size={14} className="mr-2 text-red-600" />
                            Delete visit
                          </DropdownMenuItem>
                        </>
                      )}
                      
// Continue from where it was cut off...

                      {/* Context-specific actions */}
                      {variant === 'discover' && (
                        <DropdownMenuItem onSelect={handleAddToCollection}>
                          <Plus size={14} className="mr-2 text-blue-600" />
                          Add to collection
                        </DropdownMenuItem>
                      )}

                      {onAddToRoute && (
                        <DropdownMenuItem onSelect={handleAddToRoute}>
                          <MapPin size={14} className="mr-2 text-blue-600" />
                          Add to route
                        </DropdownMenuItem>
                      )}

                      {variant === 'collection' && onRemovePlaque && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={handleRemove}>
                            <Trash2 size={14} className="mr-2 text-red-600" />
                            Remove from collection
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Selection checkbox */}
                {showSelection && onSelect && (
                  <div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer ${
                      isSelected ? 'bg-blue-500 text-white' : 'border border-gray-300'
                    }`}
                    onClick={handleSelectClick}
                  >
                    {isSelected && <CheckCircle size={14} />}
                  </div>
                )}
              </div>
            </div>
            
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1 mb-2">
              {getPlaqueColor() && getPlaqueColor() !== "Unknown" && (
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    getPlaqueColor() === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    getPlaqueColor() === 'green' ? 'bg-green-50 text-green-700 border-green-200' :
                    getPlaqueColor() === 'brown' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    getPlaqueColor() === 'black' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                    'bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                >
                  {getPlaqueColor().charAt(0).toUpperCase() + getPlaqueColor().slice(1)} Plaque
                </Badge>
              )}
              
              {plaque.lead_subject_primary_role && plaque.lead_subject_primary_role !== "Unknown" && (
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
                  {(plaque.lead_subject_primary_role as string).charAt(0).toUpperCase() + 
                   (plaque.lead_subject_primary_role as string).slice(1)}
                </Badge>
              )}
              
              {isVisited && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                  <CheckCircle size={10} className="mr-1" /> 
                  {formatVisitDate()}
                </Badge>
              )}

              {isFav && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                  <Star size={10} className="mr-1 fill-amber-600" /> Favorite
                </Badge>
              )}
            </div>
            
            {/* Short description preview */}
            {plaque.inscription && (
              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                {plaque.inscription}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Quick visit dialog */}
      <Dialog open={showQuickVisitDialog} onOpenChange={setShowQuickVisitDialog}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
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
                    onClick={(e) => e.stopPropagation()}
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
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowQuickVisitDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleQuickVisitSubmit}
              disabled={isProcessing}
            >
              {isProcessing ? 'Saving...' : 'Mark as Visited'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit visit dialog */}
      <EditVisitDialog
        isOpen={showEditVisitDialog}
        onClose={() => setShowEditVisitDialog(false)}
        plaque={plaque}
        visitId={visitInfo?.id || null}
        onVisitUpdated={() => {
          if (onMarkVisited) onMarkVisited(plaque.id);
        }}
        onVisitDeleted={() => {
          if (onMarkVisited) onMarkVisited(plaque.id);
        }}
      />

      {/* Delete visit confirmation */}
      <Dialog open={showDeleteVisitConfirm} onOpenChange={setShowDeleteVisitConfirm}>
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
              onClick={() => setShowDeleteVisitConfirm(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmDeleteVisit}
              disabled={isProcessing}
            >
              {isProcessing ? 'Deleting...' : 'Delete Visit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to collection dialog */}
      <AddToCollectionDialog
        isOpen={showAddToCollection}
        onClose={() => setShowAddToCollection(false)}
        plaque={plaque}
      />
    </>
  );
};

export default PlaqueListItem;