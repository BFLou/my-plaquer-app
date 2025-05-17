// src/components/plaques/PlaqueDetail.tsx
import React, { useState } from 'react';
import { MapPin, Star, CheckCircle, X, Info, ExternalLink, Calendar } from 'lucide-react';
import { 
  Sheet, 
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plaque } from '@/types/plaque';
import PlaqueImage from './PlaqueImage';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

type PlaqueDetailProps = {
  plaque: Plaque | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: number) => void;
  onMarkVisited?: (id: number) => void;
  nearbyPlaques?: Plaque[];
  onSelectNearbyPlaque?: (plaque: Plaque) => void;
  className?: string;
};

export const PlaqueDetail: React.FC<PlaqueDetailProps> = ({
  plaque,
  isOpen,
  onClose,
  isFavorite = false,
  onFavoriteToggle,
  onMarkVisited,
  nearbyPlaques = [],
  onSelectNearbyPlaque,
  className = '',
}) => {
  const { markAsVisited, isPlaqueVisited } = useVisitedPlaques();
  const [isMarkingVisited, setIsMarkingVisited] = useState(false);
  
  // Date picker dialog state
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [visitDate, setVisitDate] = useState<Date>(new Date());
  const [visitNotes, setVisitNotes] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  
  if (!plaque) return null;

  const handleFavoriteToggle = () => {
    if (onFavoriteToggle) onFavoriteToggle(plaque.id);
  };

  // Open date picker dialog
  const handleMarkVisitedClick = () => {
    setVisitDate(new Date());
    setVisitNotes('');
    setIsDatePickerOpen(true);
  };

  // Submit visit with the selected date
  const handleVisitSubmit = async () => {
    if (!plaque) return;
    
    setIsMarkingVisited(true);
    try {
      // Create new visit in Firebase with selected date and notes
      await markAsVisited(plaque.id, {
        visitedAt: visitDate.toISOString(),
        notes: visitNotes,
      });
      
      // Call the external handler if provided (for parent component to update UI)
      if (onMarkVisited) {
        onMarkVisited(plaque.id);
      }
      
      toast.success("Plaque marked as visited");
      setIsDatePickerOpen(false);
    } catch (error) {
      console.error("Error marking as visited:", error);
      toast.error("Failed to mark as visited");
    } finally {
      setIsMarkingVisited(false);
    }
  };

  // Parse organisations if available
  let organisations: string[] = [];
  try {
    if (plaque.organisations && plaque.organisations !== "[]" && plaque.organisations !== "Unknown") {
      organisations = JSON.parse(plaque.organisations);
    }
  } catch (e) {
    console.error('Error parsing organisations:', e);
  }

  // Parse subjects if available
  let subjects: Array<{name: string, years?: string, type?: string, role?: string}> = [];
  try {
    if (plaque.subjects && plaque.subjects !== "[]") {
      const parsedSubjects = JSON.parse(plaque.subjects);
      subjects = parsedSubjects.map((subject: string) => {
        const parts = subject.split('|');
        return {
          name: parts[0],
          years: parts[1],
          type: parts[2],
          role: parts[3]
        };
      });
    }
  } catch (e) {
    console.error('Error parsing subjects:', e);
  }

  // Format life years for subject
  const lifeYears = () => {
    if (plaque.lead_subject_born_in && plaque.lead_subject_died_in &&
        plaque.lead_subject_born_in !== "Unknown" && plaque.lead_subject_died_in !== "Unknown") {
      return `(${plaque.lead_subject_born_in} - ${plaque.lead_subject_died_in})`;
    }
    return '';
  };

  // Format plaque color for display
  const plaqueColor = plaque.color || plaque.colour || 'unknown';

  // Get location display
  const locationDisplay = plaque.location || plaque.address || '';

  // Image source with fallback
  const imageUrl = plaque.image || plaque.main_photo;

  // Check if plaque is visited already using both component prop and Firebase data
  const isVisited = plaque.visited || isPlaqueVisited(plaque.id);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className={`h-[90vh] sm:max-w-md sm:h-full sm:right-0 sm:left-auto p-0 ${className}`}>
          {/* Add SheetDescription for accessibility */}
          <SheetHeader className="sr-only">
            <SheetTitle>{plaque.title}</SheetTitle>
            <SheetDescription>Details about {plaque.title} plaque</SheetDescription>
          </SheetHeader>
          
          <div className="h-full flex flex-col overflow-hidden">
            <div className="relative h-56 bg-blue-50">
              <PlaqueImage 
                src={imageUrl}
                alt={plaque.title} 
                className="w-full h-full object-cover"
                placeholderClassName="bg-blue-50"
                plaqueColor={plaqueColor}
              />
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4 rounded-full bg-black/30 text-white hover:bg-black/40 z-10"
                onClick={onClose}
              >
                <X size={18} />
              </Button>
              
              {onFavoriteToggle && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`absolute top-4 left-4 rounded-full bg-black/30 hover:bg-black/40 z-10 ${isFavorite ? 'text-amber-500' : 'text-white'}`}
                  onClick={handleFavoriteToggle}
                >
                  <Star size={18} className={isFavorite ? 'fill-amber-500' : ''} />
                </Button>
              )}
            </div>
            
            <div className="p-6 overflow-y-auto flex-grow">
              <h2 className="text-2xl font-bold mb-1">{plaque.title}</h2>
              
              <p className="text-gray-600 flex items-start mt-1 mb-4">
                <MapPin size={16} className="mr-1 mt-1 shrink-0" /> 
                <span>{locationDisplay}</span>
                {plaque.area && <span className="ml-1">, {plaque.area}</span>}
                {plaque.postcode && <span className="ml-1">, {plaque.postcode}</span>}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {plaqueColor && plaqueColor !== "Unknown" && (
                  <Badge 
                    variant="outline" 
                    className={`
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
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                    {(plaque.lead_subject_primary_role as string).charAt(0).toUpperCase() + 
                     (plaque.lead_subject_primary_role as string).slice(1)}
                  </Badge>
                )}
                
                {plaque.erected && plaque.erected !== "Unknown" && (
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                    <Calendar size={12} className="mr-1" />
                    {plaque.erected}
                  </Badge>
                )}
                
                {isVisited && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle size={12} className="mr-1" /> Visited
                  </Badge>
                )}
              </div>
              
              {/* Inscription */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">Inscription</h3>
                <div className="border-l-4 border-gray-300 pl-4 italic">
                  {plaque.inscription}
                </div>
              </div>
              
              {/* Rest of your component content (subject info, metadata, etc.) */}
              {/* ... */}
              
              {/* Subject Information */}
              {plaque.lead_subject_name && plaque.lead_subject_name !== "Unknown" && (
                <div className="mb-6">
                  <h3 className="font-medium mb-2">About</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium">{plaque.lead_subject_name} {lifeYears()}</h4>
                    {plaque.lead_subject_primary_role && plaque.lead_subject_primary_role !== "Unknown" && (
                      <p className="text-gray-600 capitalize mt-1">{plaque.lead_subject_primary_role}</p>
                    )}
                    
                    {/* Wikipedia link if available */}
                    {plaque.lead_subject_wikipedia && plaque.lead_subject_wikipedia !== "Unknown" && (
                      <a 
                        href={plaque.lead_subject_wikipedia as string} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center text-sm text-blue-600 hover:underline"
                      >
                        <ExternalLink size={14} className="mr-1" />
                        Learn more on Wikipedia
                      </a>
                    )}
                  </div>
                </div>
              )}
              
              {/* All Subjects (if multiple) */}
              {subjects.length > 1 && (
                <div className="mb-6">
                  <h3 className="font-medium mb-2">All Subjects</h3>
                  <div className="space-y-2">
                    {subjects.map((subject, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium">{subject.name} {subject.years}</p>
                        {subject.role && (
                          <p className="text-gray-600 text-sm capitalize">{subject.role}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Plaque Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Erected</h4>
                  <p className="font-medium">{plaque.erected || 'Unknown'}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Organization</h4>
                  <p className="font-medium">
                    {organisations.length > 0 
                      ? organisations.join(', ') 
                      : 'Unknown'}
                  </p>
                </div>
  
                {plaque.series && plaque.series !== "Unknown" && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Series</h4>
                    <p className="font-medium">{plaque.series}</p>
                  </div>
                )}
  
                {plaque.language && plaque.language !== "Unknown" && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Language</h4>
                    <p className="font-medium">{plaque.language}</p>
                  </div>
                )}
              </div>
              
              {/* Location Information */}
              {plaque.latitude && plaque.longitude && (
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Location</h3>
                  <div className="bg-gray-200 p-4 rounded-lg text-center">
                    <p className="mb-2">Map coordinates: {plaque.latitude}, {plaque.longitude}</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`https://maps.google.com/?q=${plaque.latitude},${plaque.longitude}`, '_blank')}
                    >
                      <MapPin className="mr-2 h-4 w-4" /> View on Google Maps
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Nearby Plaques */}
              {nearbyPlaques.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Nearby Plaques</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {nearbyPlaques.map(nearbyPlaque => {
                      // Get image URL and color for nearby plaque
                      const nearbyImageUrl = nearbyPlaque.image || nearbyPlaque.main_photo;
                      const nearbyPlaqueColor = nearbyPlaque.color || nearbyPlaque.colour || 'unknown';
                      
                      return (
                        <div 
                          key={nearbyPlaque.id} 
                          className="shrink-0 w-40 rounded-lg bg-gray-50 overflow-hidden cursor-pointer hover:bg-gray-100 transition"
                          onClick={() => onSelectNearbyPlaque?.(nearbyPlaque)}
                        >
                          <div className="h-20 bg-gray-100 relative">
                            <PlaqueImage 
                              src={nearbyImageUrl}
                              alt={nearbyPlaque.title}
                              className="w-full h-full object-cover"
                              plaqueColor={nearbyPlaqueColor}
                            />
                          </div>
                          <div className="p-3">
                            <h4 className="font-medium text-sm mb-1 truncate">{nearbyPlaque.title}</h4>
                            <p className="text-gray-500 text-xs truncate">
                              {nearbyPlaque.address || nearbyPlaque.location}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Button 
                  className="flex-1"
                  variant={isVisited ? "outline" : "default"}
                  onClick={handleMarkVisitedClick}
                  disabled={isVisited}
                >
                  {isVisited ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" /> Visited
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" /> Mark as Visited
                    </>
                  )}
                </Button>
                
                <Button 
                  className="flex-1" 
                  variant="outline"
                  onClick={() => {
                    const location = plaque.latitude && plaque.longitude 
                      ? `${plaque.latitude},${plaque.longitude}`
                      : plaque.address;
                    window.open(`https://maps.google.com/?q=${location}`, '_blank');
                  }}
                >
                  <MapPin className="mr-2 h-4 w-4" /> Directions
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Date Picker Dialog */}
      <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>When did you visit this plaque?</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label htmlFor="visit-date">Visit Date</Label>
              
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    id="visit-date"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(visitDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={visitDate}
                    onSelect={(date) => {
                      if (date) {
                        setVisitDate(date);
                        setShowCalendar(false);
                      }
                    }}
                    initialFocus
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="visit-notes">Notes (optional)</Label>
              <Textarea
                id="visit-notes"
                placeholder="Any memories or observations about your visit?"
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDatePickerOpen(false)}
              disabled={isMarkingVisited}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleVisitSubmit}
              disabled={isMarkingVisited}
            >
              {isMarkingVisited ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                  Saving...
                </>
              ) : (
                "Save Visit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlaqueDetail;