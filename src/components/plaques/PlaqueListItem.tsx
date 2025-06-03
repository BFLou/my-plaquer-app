// src/components/plaques/PlaqueListItem.tsx - Mobile optimized with swipe actions
import React, { useState } from 'react';
import { MapPin, Star, CheckCircle, MoreVertical, Trash2, Plus, Edit, X, Calendar, Navigation, Share2, Copy, ExternalLink } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { MobileButton } from "@/components/ui/mobile-button";
import { MobileDialog } from "@/components/ui/mobile-dialog";
import { MobileInput } from "@/components/ui/mobile-input";
import { MobileTextarea } from "@/components/ui/mobile-textarea";
import { Badge } from "@/components/ui/badge";
import { Plaque } from '@/types/plaque';
import PlaqueImage from './PlaqueImage';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuthGate } from '@/hooks/useAuthGate';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useKeyboardDetection } from '@/hooks/useKeyboardDetection';
import AddToCollectionDialog from './AddToCollectionDialog';
import EditVisitDialog from './EditVisitDialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { generatePlaqueUrl } from '@/utils/urlUtils';
import { triggerHapticFeedback } from '@/utils/mobileUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  showRouteButton?: boolean;
  variant?: 'discover' | 'collection';
  className?: string;
  showDistance?: boolean;
  distance?: number;
  formatDistance?: (distance: number) => string;
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
  showRouteButton = false,
  variant = 'discover',
  className = '',
  showDistance = false,
  distance,
  formatDistance = (d) => `${d.toFixed(1)} km`
}: PlaqueListItemProps) => {
  // State for various dialogs and actions
  const [showAddToCollection, setShowAddToCollection] = useState(false);
  const [showQuickVisitDialog, setShowQuickVisitDialog] = useState(false);
  const [showEditVisitDialog, setShowEditVisitDialog] = useState(false);
  const [showDeleteVisitConfirm, setShowDeleteVisitConfirm] = useState(false);
  const [showSwipeActions, setShowSwipeActions] = useState(false);
  
  // Quick visit form state
  const [visitDate, setVisitDate] = useState<Date>(new Date());
  const [visitNotes, setVisitNotes] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Use hooks for consistent state management
  const { isPlaqueVisited, markAsVisited, removeVisit, getVisitInfo } = useVisitedPlaques();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isKeyboardOpen, keyboardHeight } = useKeyboardDetection();
  
  // Auth gate integration
  const { 
    requireAuthForVisit, 
    requireAuthForFavorite, 
    requireAuthForCollection,
    isAuthenticated 
  } = useAuthGate();
  
  // Determine if the plaque is visited and favorited
  const isVisited = plaque.visited || isPlaqueVisited(plaque.id);
  const isFav = isFavorite(plaque.id);
  const visitInfo = getVisitInfo(plaque.id);

  // Swipe gesture handling for mobile actions
  const { handleTouchStart, handleTouchEnd, handleTouchMove } = useSwipeGesture({
    onSwipe: (direction, distance) => {
      if (direction === 'right' && distance > 80) {
        // Swipe right for favorite toggle
        triggerHapticFeedback('selection');
        handleFavoriteClick();
      } else if (direction === 'left' && distance > 80) {
        // Swipe left for quick actions
        triggerHapticFeedback('selection');
        setShowSwipeActions(true);
        setTimeout(() => setShowSwipeActions(false), 3000);
      }
    },
    threshold: 80,
    timeThreshold: 400
  });

  // Event handlers with auth gate integration and haptic feedback
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
    
    triggerHapticFeedback('selection');
    if (onClick) onClick(plaque);
  };

  const handleFavoriteClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    const favoriteAction = () => {
      toggleFavorite(plaque.id);
    };

    requireAuthForFavorite(plaque.id, favoriteAction);
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHapticFeedback('selection');
    if (onSelect) onSelect(plaque.id);
  };

  const handleQuickMarkVisited = () => {
    const visitAction = () => {
      setShowQuickVisitDialog(true);
    };

    requireAuthForVisit(plaque.id, visitAction);
  };

  const handleEditVisit = () => {
    setShowEditVisitDialog(true);
  };

  const handleDeleteVisit = () => {
    triggerHapticFeedback('warning');
    setShowDeleteVisitConfirm(true);
  };

  const handleRemove = () => {
    triggerHapticFeedback('warning');
    if (onRemovePlaque) onRemovePlaque(plaque.id);
  };

  const handleAddToCollection = () => {
    const collectionAction = () => {
      setShowAddToCollection(true);
    };

    requireAuthForCollection(plaque.id, collectionAction);
  };

  const handleAddToRoute = () => {
    triggerHapticFeedback('light');
    if (onAddToRoute) onAddToRoute(plaque);
  };

  // Share/Copy functionality (no auth required)
  const handleCopyLink = async () => {
    try {
      const plaqueUrl = generatePlaqueUrl(plaque.id);
      await navigator.clipboard.writeText(plaqueUrl);
      triggerHapticFeedback('success');
      toast.success('Link copied to clipboard!');
    } catch (error) {
      console.error('Error copying link:', error);
      triggerHapticFeedback('error');
      toast.error("Couldn't copy link");
    }
  };

  const handleShare = async () => {
    const shareUrl = generatePlaqueUrl(plaque.id);
    
    const shareData = {
      title: plaque.title,
      text: `Check out this historic plaque: ${plaque.title}`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        triggerHapticFeedback('success');
      } catch (error) {
        if (error.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleViewFullDetails = () => {
    triggerHapticFeedback('selection');
    window.open(`/plaque/${plaque.id}`, '_blank');
  };

  // Quick visit form submission
  const handleQuickVisitSubmit = async () => {
    setIsProcessing(true);
    triggerHapticFeedback('light');
    
    try {
      await markAsVisited(plaque.id, {
        visitedAt: visitDate.toISOString(),
        notes: visitNotes,
      });
      
      if (onMarkVisited) onMarkVisited(plaque.id);
      triggerHapticFeedback('success');
      toast.success("Marked as visited");
      setShowQuickVisitDialog(false);
      setVisitNotes('');
      setVisitDate(new Date());
    } catch (error) {
      console.error("Error marking as visited:", error);
      triggerHapticFeedback('error');
      toast.error("Failed to mark as visited");
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete visit confirmation
  const handleConfirmDeleteVisit = async () => {
    if (!visitInfo) return;
    
    setIsProcessing(true);
    triggerHapticFeedback('light');
    
    try {
      await removeVisit(visitInfo.id);
      triggerHapticFeedback('success');
      toast.success("Visit deleted");
      setShowDeleteVisitConfirm(false);
    } catch (error) {
      console.error("Error deleting visit:", error);
      triggerHapticFeedback('error');
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
        className={`overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 touch-manipulation relative ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        } ${showSwipeActions ? 'shadow-lg scale-[1.02]' : ''} ${className}`}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
        {/* Swipe action indicator */}
        {showSwipeActions && (
          <div className="absolute inset-0 bg-blue-50 border-2 border-blue-200 rounded-lg z-10 flex items-center justify-center">
            <div className="text-blue-600 text-center">
              <div className="text-lg font-semibold">Quick Actions Available</div>
              <div className="text-sm">Tap menu for options</div>
            </div>
          </div>
        )}

        <div className="flex">
          {/* Image - Mobile optimized */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0">
            <PlaqueImage 
              src={getImageUrl()}
              alt={plaque.title} 
              className="w-full h-full object-cover rounded-l-lg"
              placeholderClassName="bg-blue-50"
              plaqueColor={getPlaqueColor()}
            />
          </div>
          
          {/* Content - Mobile optimized */}
          <div className="flex-grow p-4 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <div className="min-w-0 flex-grow pr-3">
                <h3 className="font-semibold text-base sm:text-lg line-clamp-2 mb-2 leading-tight">
                  {plaque.title}
                </h3>
                <p className="text-gray-500 text-sm sm:text-base flex items-start">
                  <MapPin size={14} className="mr-2 mt-0.5 shrink-0" /> 
                  <span className="line-clamp-2">{getLocationDisplay()}</span>
                </p>
              </div>
              
              {/* Actions - Mobile friendly layout */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Mobile: Essential actions only */}
                <div className="flex sm:hidden items-center gap-1">
                  <MobileButton 
                    variant="ghost" 
                    size="sm" 
                    className={`w-9 h-9 p-0 ${isFav ? 'text-amber-500' : 'text-gray-400'}`}
                    onClick={handleFavoriteClick}
                    touchOptimized={true}
                  >
                    <Star size={16} className={isFav ? 'fill-amber-500' : ''} />
                  </MobileButton>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <MobileButton 
                        variant="ghost" 
                        size="sm" 
                        className="w-9 h-9 p-0" 
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHapticFeedback('selection');
                        }}
                        touchOptimized={true}
                      >
                        <MoreVertical size={16} />
                      </MobileButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {/* View Full Details */}
                      <DropdownMenuItem onSelect={handleViewFullDetails} className="py-3">
                        <ExternalLink size={16} className="mr-3 text-blue-600" />
                        <span className="text-base">View Full Details</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      {/* Share options */}
                      <DropdownMenuItem onSelect={handleShare} className="py-3">
                        <Share2 size={16} className="mr-3 text-purple-600" />
                        <span className="text-base">Share Plaque</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onSelect={handleCopyLink} className="py-3">
                        <Copy size={16} className="mr-3 text-gray-600" />
                        <span className="text-base">Copy Link</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      {/* Visit actions */}
                      {!isVisited ? (
                        <DropdownMenuItem onSelect={handleQuickMarkVisited} className="py-3">
                          <CheckCircle size={16} className="mr-3 text-green-600" />
                          <span className="text-base">Mark as visited</span>
                        </DropdownMenuItem>
                      ) : (
                        isAuthenticated && visitInfo && (
                          <>
                            <DropdownMenuItem onSelect={handleEditVisit} className="py-3">
                              <Edit size={16} className="mr-3 text-blue-600" />
                              <span className="text-base">Edit visit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={handleDeleteVisit} className="py-3">
                              <X size={16} className="mr-3 text-red-600" />
                              <span className="text-base">Delete visit</span>
                            </DropdownMenuItem>
                          </>
                        )
                      )}
                      
                      {/* Context-specific actions */}
                      {variant === 'discover' && (
                        <DropdownMenuItem onSelect={handleAddToCollection} className="py-3">
                          <Plus size={16} className="mr-3 text-blue-600" />
                          <span className="text-base">Add to collection</span>
                        </DropdownMenuItem>
                      )}

                      {onAddToRoute && (
                        <DropdownMenuItem onSelect={handleAddToRoute} className="py-3">
                          <Plus size={16} className="mr-3 text-green-600" />
                          <span className="text-base">Add to route</span>
                        </DropdownMenuItem>
                      )}

                      {variant === 'collection' && onRemovePlaque && isAuthenticated && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={handleRemove} className="py-3">
                            <Trash2 size={16} className="mr-3 text-red-600" />
                            <span className="text-base">Remove from collection</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Desktop: Show favorite and dropdown */}
                <div className="hidden sm:flex items-center gap-2">
                  <MobileButton 
                    variant="ghost" 
                    size="sm" 
                    className={`w-10 h-10 p-0 ${isFav ? 'text-amber-500' : 'text-gray-400'}`}
                    onClick={handleFavoriteClick}
                    touchOptimized={true}
                  >
                    <Star size={18} className={isFav ? 'fill-amber-500' : ''} />
                  </MobileButton>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <MobileButton 
                        variant="ghost" 
                        size="sm" 
                        className="w-10 h-10 p-0" 
                        onClick={(e) => e.stopPropagation()}
                        touchOptimized={true}
                      >
                        <MoreVertical size={18} />
                      </MobileButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {/* Same menu items as mobile */}
                      <DropdownMenuItem onSelect={handleViewFullDetails} className="py-3">
                        <ExternalLink size={16} className="mr-3 text-blue-600" />
                        <span className="text-base">View Full Details</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem onSelect={handleShare} className="py-3">
                        <Share2 size={16} className="mr-3 text-purple-600" />
                        <span className="text-base">Share Plaque</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onSelect={handleCopyLink} className="py-3">
                        <Copy size={16} className="mr-3 text-gray-600" />
                        <span className="text-base">Copy Link</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      {!isVisited ? (
                        <DropdownMenuItem onSelect={handleQuickMarkVisited} className="py-3">
                          <CheckCircle size={16} className="mr-3 text-green-600" />
                          <span className="text-base">Mark as visited</span>
                        </DropdownMenuItem>
                      ) : (
                        isAuthenticated && visitInfo && (
                          <>
                            <DropdownMenuItem onSelect={handleEditVisit} className="py-3">
                              <Edit size={16} className="mr-3 text-blue-600" />
                              <span className="text-base">Edit visit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={handleDeleteVisit} className="py-3">
                              <X size={16} className="mr-3 text-red-600" />
                              <span className="text-base">Delete visit</span>
                            </DropdownMenuItem>
                          </>
                        )
                      )}
                      
                      {variant === 'discover' && (
                        <DropdownMenuItem onSelect={handleAddToCollection} className="py-3">
                          <Plus size={16} className="mr-3 text-blue-600" />
                          <span className="text-base">Add to collection</span>
                        </DropdownMenuItem>
                      )}

                      {onAddToRoute && (
                        <DropdownMenuItem onSelect={handleAddToRoute} className="py-3">
                          <Plus size={16} className="mr-3 text-green-600" />
                          <span className="text-base">Add to route</span>
                        </DropdownMenuItem>
                      )}

                      {variant === 'collection' && onRemovePlaque && isAuthenticated && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={handleRemove} className="py-3">
                            <Trash2 size={16} className="mr-3 text-red-600" />
                            <span className="text-base">Remove from collection</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Selection checkbox - Mobile optimized */}
                {showSelection && onSelect && (
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer touch-manipulation ${
                      isSelected ? 'bg-blue-500 text-white' : 'border-2 border-gray-300'
                    }`}
                    onClick={handleSelectClick}
                  >
                    {isSelected && <CheckCircle size={16} />}
                  </div>
                )}
              </div>
            </div>
            
            {/* Badges - Mobile optimized */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {/* Distance badge - shows first for prominence */}
              {showDistance && distance !== undefined && distance !== Infinity && (
                <Badge variant="secondary" className="text-sm bg-green-50 text-green-700 border-green-200 py-1 px-2">
                  <Navigation size={12} className="mr-1" />
                  {formatDistance(distance)}
                </Badge>
              )}

              {getPlaqueColor() && getPlaqueColor() !== "Unknown" && (
                <Badge 
                  variant="outline" 
                  className={`text-sm py-1 px-2 ${
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
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-sm py-1 px-2">
                  {(plaque.lead_subject_primary_role as string).charAt(0).toUpperCase() + 
                   (plaque.lead_subject_primary_role as string).slice(1)}
                </Badge>
              )}
              
              {isVisited && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-sm py-1 px-2">
                  <CheckCircle size={12} className="mr-1" /> 
                  {formatVisitDate()}
                </Badge>
              )}

              {isFav && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-sm py-1 px-2">
                  <Star size={12} className="mr-1 fill-amber-600" /> Favorite
                </Badge>
              )}
            </div>

            {/* Route button for mobile - Mobile optimized */}
            {showRouteButton && onAddToRoute && (
              <div className="mb-3">
                <MobileButton
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToRoute();
                  }}
                  className="h-9 text-sm"
                  touchOptimized={true}
                >
                  <Plus size={14} className="mr-2" />
                  Add to Route
                </MobileButton>
              </div>
            )}
            
            {/* Short description preview */}
            {plaque.inscription && (
              <p className="text-sm sm:text-base text-gray-600 line-clamp-2 leading-relaxed">
                {plaque.inscription}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Mobile optimized dialogs */}
      <>
        {/* Quick visit dialog */}
        <MobileDialog
          isOpen={showQuickVisitDialog}
          onClose={() => setShowQuickVisitDialog(false)}
          title="Mark as Visited"
          size="md"
          className={isKeyboardOpen ? `mb-[${keyboardHeight}px]` : ''}
          footer={
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <MobileButton
                variant="outline"
                onClick={() => setShowQuickVisitDialog(false)}
                disabled={isProcessing}
                className="flex-1"
              >
                Cancel
              </MobileButton>
              <MobileButton 
                onClick={handleQuickVisitSubmit}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? 'Saving...' : 'Mark as Visited'}
              </MobileButton>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-base font-medium">Visit Date</label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <MobileButton
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-12"
                    onClick={(e) => e.stopPropagation()}
                    touchOptimized={true}
                  >
                    <Calendar className="mr-3 h-5 w-5" />
                    <span className="text-base">{format(visitDate, "PPP")}</span>
                  </MobileButton>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={visitDate}
                    onSelect={(date) => {
                      if (date) {
                        triggerHapticFeedback('selection');
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

            <div className="space-y-3">
              <label className="text-base font-medium">Notes (optional)</label>
              <MobileTextarea
                placeholder="Any thoughts about your visit?"
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                rows={4}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </MobileDialog>

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
        <MobileDialog
          isOpen={showDeleteVisitConfirm}
          onClose={() => setShowDeleteVisitConfirm(false)}
          title="Delete Visit"
          size="sm"
          footer={
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <MobileButton
                variant="outline"
                onClick={() => setShowDeleteVisitConfirm(false)}
                disabled={isProcessing}
                className="flex-1"
              >
                Cancel
              </MobileButton>
              <MobileButton 
                variant="destructive"
                onClick={handleConfirmDeleteVisit}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? 'Deleting...' : 'Delete Visit'}
              </MobileButton>
            </div>
          }
        >
          <div className="py-4">
            <p className="text-base text-gray-600 leading-relaxed">
              Are you sure you want to delete your visit to this plaque? This action cannot be undone.
            </p>
          </div>
        </MobileDialog>

        {/* Add to collection dialog */}
        <AddToCollectionDialog
          isOpen={showAddToCollection}
          onClose={() => setShowAddToCollection(false)}
          plaque={plaque}
        />
      </>
    </>
  );
};

export default PlaqueListItem;