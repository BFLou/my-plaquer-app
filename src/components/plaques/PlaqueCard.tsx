// src/components/plaques/PlaqueCard.tsx - Enhanced with navigation options
import React, { useState } from 'react';
import { MapPin, Star, CheckCircle, MoreVertical, Trash2, Plus, Calendar, Edit, X, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type NavigationMode = 'modal' | 'url' | 'new-tab';

type PlaqueCardProps = {
  plaque: Plaque;
  isSelected?: boolean;
  onSelect?: (id: number) => void;
  onMarkVisited?: (id: number) => void;
  onRemovePlaque?: (id: number) => void;
  onClick?: (plaque: Plaque) => void;
  onAddToRoute?: (plaque: Plaque) => void;
  showCollectionActions?: boolean;
  showSelection?: boolean;
  showRouteButton?: boolean;
  variant?: 'discover' | 'collection';
  className?: string;
  navigationMode?: NavigationMode; // NEW: Control navigation behavior
  // Distance display props
  showDistance?: boolean;
  distance?: number;
  formatDistance?: (distance: number) => string;
};

export const PlaqueCard = ({
  plaque,
  isSelected = false,
  onSelect,
  onMarkVisited,
  onRemovePlaque,
  onClick,
  onAddToRoute,
  showCollectionActions = false,
  showSelection = false,
  showRouteButton = false,
  variant = 'discover',
  className = '',
  navigationMode = 'modal', // NEW: Default to modal
  // Distance props
  showDistance = false,
  distance,
  formatDistance = (d) => `${d.toFixed(1)} km`
}: PlaqueCardProps) => {
  // State for various dialogs and actions
  const [showDropdown, setShowDropdown] = useState(false);
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
  
  // Determine if the plaque is visited and get visit info
  const isVisited = plaque.visited || isPlaqueVisited(plaque.id);
  const isFav = isFavorite(plaque.id);
  const visitInfo = getVisitInfo(plaque.id);

  // NEW: Navigation handler
  const navigateToPlaque = (plaque: Plaque, mode: NavigationMode) => {
    switch (mode) {
      case 'url':
        window.location.href = `/plaque/${plaque.id}`;
        break;
      case 'new-tab':
        window.open(`/plaque/${plaque.id}`, '_blank');
        break;
      case 'modal':
      default:
        if (onClick) onClick(plaque);
        break;
    }
  };

  // Event handlers
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent card click when interacting with buttons or dropdowns
    if (e.target instanceof Element && (
      e.target.closest('button') ||
      e.target.closest('[role="menuitem"]') ||
      e.target.closest('.dropdown-menu') ||
      e.target.closest('[data-radix-portal]')
    )) {
      return;
    }
    
    // NEW: Use navigation mode to determine behavior
    navigateToPlaque(plaque, navigationMode);
  };

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(plaque.id);
    setShowDropdown(false);
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) onSelect(plaque.id);
  };

  const handleQuickMarkVisited = () => {
    setShowQuickVisitDialog(true);
    setShowDropdown(false);
  };

  const handleEditVisit = () => {
    setShowEditVisitDialog(true);
    setShowDropdown(false);
  };

  const handleDeleteVisit = () => {
    setShowDeleteVisitConfirm(true);
    setShowDropdown(false);
  };

  const handleRemove = () => {
    if (onRemovePlaque) onRemovePlaque(plaque.id);
    setShowDropdown(false);
  };

  const handleAddToCollection = () => {
    setShowAddToCollection(true);
    setShowDropdown(false);
  };

  const handleAddToRoute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToRoute) {
      onAddToRoute(plaque);
    }
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
        className={`overflow-hidden hover:shadow-md transition-shadow cursor-pointer group relative h-full ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        } ${className}`}
        onClick={handleCardClick}
      >
        {/* Image container */}
        <div className="relative h-32 sm:h-40 bg-blue-50">
          <PlaqueImage 
            src={getImageUrl()}
            alt={plaque.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            placeholderClassName="bg-blue-50"
            plaqueColor={getPlaqueColor()}
          />
          
          {/* Actions menu */}
          <div className="absolute top-2 right-2 z-20">
            <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 rounded-full bg-black/30 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
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
                
                {/* Favorite action */}
                <DropdownMenuItem onSelect={handleFavoriteToggle}>
                  <Star size={14} className={`mr-2 ${isFav ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`} />
                  {isFav ? 'Remove from favorites' : 'Add to favorites'}
                </DropdownMenuItem>

                {/* Context-specific actions */}
                {variant === 'discover' && (
                  <DropdownMenuItem onSelect={handleAddToCollection}>
                    <Plus size={14} className="mr-2 text-blue-600" />
                    Add to collection
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
          
          {/* Status badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {/* Distance badge - shows first for prominence */}
            {showDistance && distance !== undefined && distance !== Infinity && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                <Navigation size={10} className="mr-1" />
                {formatDistance(distance)}
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
        </div>
        
        {/* Content */}
        <CardHeader className="pb-2 px-3 sm:px-6">
          <CardTitle className="text-base sm:text-lg font-bold group-hover:text-blue-600 transition-colors line-clamp-2">
            {plaque.title}
          </CardTitle>
          <CardDescription className="flex items-start text-gray-500 text-sm">
            <MapPin size={12} className="mr-1 mt-0.5 shrink-0" /> 
            <span className="line-clamp-2">{getLocationDisplay()}</span>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-0 px-3 sm:px-6 pb-3">
          {/* Badges */}
          <div className="flex flex-wrap gap-1 mb-3">
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
          </div>
          
          {/* Description preview */}
          {plaque.inscription && (
            <p className="mt-2 text-xs sm:text-sm text-gray-600 line-clamp-2">
              {plaque.inscription}
            </p>
          )}
          
          {/* Route button */}
          {showRouteButton && onAddToRoute && (
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddToRoute}
                className="w-full h-8 text-xs"
              >
                <Plus size={12} className="mr-1" />
                Add to Route
              </Button>
            </div>
          )}
          
          {/* Selection checkbox */}
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
        </CardContent>
      </Card>

      {/* All the dialogs remain the same */}
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

export default PlaqueCard;