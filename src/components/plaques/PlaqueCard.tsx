// src/components/plaques/PlaqueCard.tsx - Mobile optimized with touch enhancements
import React, { useState } from 'react';
import {
  MapPin,
  Star,
  CheckCircle,
  MoreVertical,
  Trash2,
  Plus,
  Calendar,
  Edit,
  X,
  Navigation,
  ExternalLink,
  Share2,
  Copy,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MobileButton } from '@/components/ui/mobile-button';
import { MobileDialog } from '@/components/ui/mobile-dialog';
import { MobileTextarea } from '@/components/ui/mobile-textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plaque } from '@/types/plaque';
import PlaqueImage from './PlaqueImage';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuthGate } from '@/hooks/useAuthGate';
import { useKeyboardDetection } from '@/hooks/useKeyboardDetection';
import AddToCollectionDialog from './AddToCollectionDialog';
import EditVisitDialog from './EditVisitDialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { generatePlaqueUrl } from '@/utils/urlUtils';
import { triggerHapticFeedback } from '@/utils/mobileUtils';

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
  navigationMode?: NavigationMode;
  showDistance?: boolean;
  distance?: number;
  formatDistance?: (distance: number) => string;
  context?: string;
  onFavoriteToggle?: (id: number) => void;
};

export const PlaqueCard = ({
  plaque,
  isSelected = false,
  onSelect,
  onMarkVisited,
  onRemovePlaque,
  onClick,
  onAddToRoute,
  showSelection = false,
  showRouteButton = false,
  variant = 'discover',
  className = '',
  navigationMode = 'modal',
  showDistance = false,
  distance,
  formatDistance = (d) => `${d.toFixed(1)} km`,
  onFavoriteToggle,
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
  const { isPlaqueVisited, markAsVisited, removeVisit, getVisitInfo } =
    useVisitedPlaques();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isKeyboardOpen, keyboardHeight } = useKeyboardDetection();

  // Auth gate integration
  const {
    requireAuthForVisit,
    requireAuthForFavorite,
    requireAuthForCollection,
    isAuthenticated,
  } = useAuthGate();

  // Determine if the plaque is visited and get visit info
  const isVisited = plaque.visited || isPlaqueVisited(plaque.id);
  const isFav = isFavorite(plaque.id);
  const visitInfo = getVisitInfo(plaque.id);

  // Navigation handler based on mode with haptic feedback
  const navigateToPlaque = (plaque: Plaque, mode: NavigationMode) => {
    triggerHapticFeedback('selection');
    console.log(`Navigating to plaque ${plaque.id} with mode: ${mode}`);

    switch (mode) {
      case 'url':
        window.location.href = `/plaque/${plaque.id}`;
        break;
      case 'new-tab':
        window.open(`/plaque/${plaque.id}`, '_blank');
        break;
      case 'modal':
      default:
        if (onClick) {
          console.log('Calling onClick handler for modal navigation');
          onClick(plaque);
        } else {
          console.warn('No onClick handler provided for modal navigation');
        }
        break;
    }
  };

  // Event handlers with haptic feedback
  const handleCardClick = (e: React.MouseEvent) => {
    if (
      e.target instanceof Element &&
      (e.target.closest('button') ||
        e.target.closest('[role="menuitem"]') ||
        e.target.closest('.dropdown-menu') ||
        e.target.closest('[data-radix-portal]') ||
        e.target.closest('[data-state]'))
    ) {
      console.log('Click blocked - interacting with UI element');
      return;
    }

    console.log(`Card clicked for plaque: ${plaque.title}`);
    navigateToPlaque(plaque, navigationMode);
  };

  // Auth-gated action handlers with haptic feedback
  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHapticFeedback('selection');
    console.log(`Toggling favorite for plaque: ${plaque.id}`);

    const favoriteAction = () => {
      if (onFavoriteToggle) {
        onFavoriteToggle(plaque.id);
      } else {
        toggleFavorite(plaque.id);
      }
      setShowDropdown(false);
    };

    requireAuthForFavorite(plaque.id, favoriteAction);
  };

  const handleQuickMarkVisited = () => {
    const visitAction = () => {
      setShowQuickVisitDialog(true);
      setShowDropdown(false);
    };

    requireAuthForVisit(plaque.id, visitAction);
  };

  const handleAddToCollection = () => {
    const collectionAction = () => {
      setShowAddToCollection(true);
      setShowDropdown(false);
    };

    requireAuthForCollection(plaque.id, collectionAction);
  };

  // These handlers are only called for authenticated users
  const handleEditVisit = () => {
    setShowEditVisitDialog(true);
    setShowDropdown(false);
  };

  const handleDeleteVisit = () => {
    triggerHapticFeedback('warning');
    setShowDeleteVisitConfirm(true);
    setShowDropdown(false);
  };

  const handleRemove = () => {
    triggerHapticFeedback('warning');
    if (onRemovePlaque) onRemovePlaque(plaque.id);
    setShowDropdown(false);
  };

  const handleAddToRoute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerHapticFeedback('light');
    if (onAddToRoute) {
      onAddToRoute(plaque);
    }
  };

  const handleViewFullDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerHapticFeedback('selection');
    console.log('View full details clicked');
    window.open(`/plaque/${plaque.id}`, '_blank');
    setShowDropdown(false);
  };

  // Share/Copy functionality (no auth required)
  const handleCopyLink = async () => {
    try {
      const plaqueUrl = generatePlaqueUrl(plaque.id);
      await navigator.clipboard.writeText(plaqueUrl);
      triggerHapticFeedback('success');
      toast.success('Link copied to clipboard!');
      setShowDropdown(false);
    } catch (error) {
      console.error('Error copying link:', error);
      triggerHapticFeedback('error');
      toast.error("Couldn't copy link");
      setShowDropdown(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = generatePlaqueUrl(plaque.id);

    const shareData = {
      title: plaque.title,
      text: `Check out this historic plaque: ${plaque.title}`,
      url: shareUrl,
    };

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare(shareData)
    ) {
      try {
        await navigator.share(shareData);
        triggerHapticFeedback('success');
        setShowDropdown(false);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  // Visit form submission (only called when authenticated)
  const handleQuickVisitSubmit = async () => {
    setIsProcessing(true);
    triggerHapticFeedback('light');

    try {
      await markAsVisited(plaque.id, {
        visitedAt: visitDate.toISOString(),
        notes: visitNotes,
      });

      triggerHapticFeedback('success');
      toast.success('Marked as visited');
      setShowQuickVisitDialog(false);
      setVisitNotes('');
      setVisitDate(new Date());
    } catch (error) {
      console.error('Error marking as visited:', error);
      triggerHapticFeedback('error');
      toast.error('Failed to mark as visited');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDeleteVisit = async () => {
    if (!visitInfo) return;

    setIsProcessing(true);
    triggerHapticFeedback('light');

    try {
      await removeVisit(visitInfo.id);
      triggerHapticFeedback('success');
      toast.success('Visit deleted');
      setShowDeleteVisitConfirm(false);
    } catch (error) {
      console.error('Error deleting visit:', error);
      triggerHapticFeedback('error');
      toast.error('Failed to delete visit');
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
      const date = new Date(visitInfo.visited_at);
      return format(date, 'MMM d');
    } catch (error) {
      return 'Unknown date';
    }
  };

  const getHoverClasses = () => {
    switch (navigationMode) {
      case 'new-tab':
        return 'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]';
      case 'url':
        return 'hover:shadow-md hover:ring-2 hover:ring-blue-200 active:ring-blue-300';
      case 'modal':
      default:
        return 'hover:shadow-md active:shadow-lg';
    }
  };

  const handleCheckboxChange = () => {
    if (onSelect) {
      onSelect(plaque.id);
    }
  };

  return (
    <>
      <Card
        className={`overflow-hidden transition-all duration-200 cursor-pointer group relative h-full touch-manipulation ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        } ${getHoverClasses()} ${className}`}
        onClick={handleCardClick}
        title={
          navigationMode === 'new-tab'
            ? 'Click to open in new tab'
            : navigationMode === 'url'
              ? 'Click to view details'
              : 'Click to view details'
        }
      >
        {/* Image container - Mobile optimized */}
        <div className="relative h-40 sm:h-44 bg-blue-50">
          <PlaqueImage
            src={getImageUrl()}
            alt={plaque.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            placeholderClassName="bg-blue-50"
            plaqueColor={getPlaqueColor()}
          />

          {/* Navigation mode indicator */}
          {navigationMode === 'new-tab' && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-blue-600 text-white p-2 rounded-full">
                <ExternalLink size={14} />
              </div>
            </div>
          )}

          {/* Actions menu - Mobile optimized */}
          <div className="absolute top-3 right-3 z-20">
            <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
              <DropdownMenuTrigger asChild>
                <MobileButton
                  variant="ghost"
                  size="sm"
                  className="rounded-full bg-black/30 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity p-0 w-10 h-10"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    triggerHapticFeedback('selection');
                    console.log('Dropdown menu clicked');
                  }}
                  touchOptimized={true}
                >
                  <MoreVertical size={18} />
                </MobileButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-52"
                onClick={(e) => e.stopPropagation()}
                sideOffset={8}
              >
                {/* View Full Details option */}
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    handleViewFullDetails(e as unknown as React.MouseEvent);
                  }}
                  className="cursor-pointer py-3"
                >
                  <ExternalLink size={16} className="mr-3 text-blue-600" />
                  <span className="text-base">View Full Details</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Share options */}
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    handleShare();
                  }}
                  className="cursor-pointer py-3"
                >
                  <Share2 size={16} className="mr-3 text-purple-600" />
                  <span className="text-base">Share Plaque</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    handleCopyLink();
                  }}
                  className="cursor-pointer py-3"
                >
                  <Copy size={16} className="mr-3 text-gray-600" />
                  <span className="text-base">Copy Link</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Visit actions */}
                {!isVisited ? (
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      handleQuickMarkVisited();
                    }}
                    className="cursor-pointer py-3"
                  >
                    <CheckCircle size={16} className="mr-3 text-green-600" />
                    <span className="text-base">Mark as visited</span>
                  </DropdownMenuItem>
                ) : (
                  isAuthenticated &&
                  visitInfo && (
                    <>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          handleEditVisit();
                        }}
                        className="cursor-pointer py-3"
                      >
                        <Edit size={16} className="mr-3 text-blue-600" />
                        <span className="text-base">Edit visit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          handleDeleteVisit();
                        }}
                        className="cursor-pointer py-3"
                      >
                        <X size={16} className="mr-3 text-red-600" />
                        <span className="text-base">Delete visit</span>
                      </DropdownMenuItem>
                    </>
                  )
                )}

                {/* Favorite action */}
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    handleFavoriteToggle(e as unknown as React.MouseEvent);
                  }}
                  className="cursor-pointer py-3"
                >
                  <Star
                    size={16}
                    className={`mr-3 ${isFav ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`}
                  />
                  <span className="text-base">
                    {isFav ? 'Remove from favorites' : 'Add to favorites'}
                  </span>
                </DropdownMenuItem>

                {/* Collection action */}
                {variant === 'discover' && (
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      handleAddToCollection();
                    }}
                    className="cursor-pointer py-3"
                  >
                    <Plus size={16} className="mr-3 text-blue-600" />
                    <span className="text-base">Add to collection</span>
                  </DropdownMenuItem>
                )}

                {/* Remove from collection */}
                {variant === 'collection' &&
                  onRemovePlaque &&
                  isAuthenticated && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          handleRemove();
                        }}
                        className="cursor-pointer py-3"
                      >
                        <Trash2 size={16} className="mr-3 text-red-600" />
                        <span className="text-base">
                          Remove from collection
                        </span>
                      </DropdownMenuItem>
                    </>
                  )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Status badges - Mobile optimized */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {/* Distance badge */}
            {showDistance &&
              distance !== undefined &&
              distance !== Infinity && (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 text-sm py-1 px-2"
                >
                  <Navigation size={12} className="mr-1" />
                  {formatDistance(distance)}
                </Badge>
              )}

            {isVisited && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 text-sm py-1 px-2"
              >
                <CheckCircle size={12} className="mr-1" />
                {formatVisitDate()}
              </Badge>
            )}
            {isFav && (
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-800 text-sm py-1 px-2"
              >
                <Star size={12} className="mr-1 fill-amber-600" /> Favorite
              </Badge>
            )}
          </div>
        </div>

        {/* Content - Mobile optimized */}
        <CardHeader className="pb-3 px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl font-bold group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
            {plaque.title}
          </CardTitle>
          <CardDescription className="flex items-start text-gray-500 text-base mt-2">
            <MapPin size={14} className="mr-2 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{getLocationDisplay()}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0 px-4 sm:px-6 pb-4">
          {/* Badges - Mobile optimized */}
          <div className="flex flex-wrap gap-2 mb-3">
            {getPlaqueColor() && getPlaqueColor() !== 'Unknown' && (
              <Badge
                variant="outline"
                className={`text-sm py-1 px-2 ${
                  getPlaqueColor() === 'blue'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : getPlaqueColor() === 'green'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : getPlaqueColor() === 'brown'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : getPlaqueColor() === 'black'
                          ? 'bg-gray-100 text-gray-700 border-gray-300'
                          : 'bg-gray-100 text-gray-700 border-gray-300'
                }`}
              >
                {getPlaqueColor().charAt(0).toUpperCase() +
                  getPlaqueColor().slice(1)}{' '}
                Plaque
              </Badge>
            )}

            {plaque.lead_subject_primary_role &&
              plaque.lead_subject_primary_role !== 'Unknown' && (
                <Badge
                  variant="outline"
                  className="bg-gray-50 text-gray-700 border-gray-200 text-sm py-1 px-2"
                >
                  {(plaque.lead_subject_primary_role as string)
                    .charAt(0)
                    .toUpperCase() +
                    (plaque.lead_subject_primary_role as string).slice(1)}
                </Badge>
              )}
          </div>

          {/* Description preview */}
          {plaque.inscription && (
            <p className="mt-3 text-sm sm:text-base text-gray-600 line-clamp-2 leading-relaxed">
              {plaque.inscription}
            </p>
          )}

          {/* Navigation mode hint */}
          {navigationMode === 'new-tab' && (
            <div className="mt-3">
              <Badge
                variant="outline"
                className="text-sm bg-blue-50 text-blue-600 border-blue-200 py-1 px-2"
              >
                <ExternalLink size={12} className="mr-1" />
                Opens in new tab
              </Badge>
            </div>
          )}

          {/* Route button - Mobile optimized */}
          {showRouteButton && onAddToRoute && (
            <div className="mt-4">
              <MobileButton
                size="sm"
                variant="outline"
                onClick={handleAddToRoute}
                className="w-full h-10 text-sm"
                touchOptimized={true}
              >
                <Plus size={14} className="mr-2" />
                Add to Route
              </MobileButton>
            </div>
          )}

          {/* Selection checkbox - Mobile optimized */}
          {showSelection && onSelect && (
            <div className="mt-4 flex items-center">
              <label className="flex items-center cursor-pointer text-base touch-manipulation">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={handleCheckboxChange}
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                />
                <span className="text-gray-600">Select</span>
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All dialogs - Mobile optimized */}
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
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    touchOptimized={true}
                  >
                    <Calendar className="mr-3 h-5 w-5" />
                    <span className="text-base">
                      {format(visitDate, 'PPP')}
                    </span>
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
                    disabled={(date) =>
                      date > new Date() || date < new Date('1900-01-01')
                    }
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
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
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
              Are you sure you want to delete your visit to this plaque? This
              action cannot be undone.
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

export default PlaqueCard;
