// src/components/plaques/VisitLogger.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Star, X, Share2, Check, Image, Edit, Plus, Award, Calendar } from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plaque } from '@/types/plaque';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Types for visit data
interface VisitData {
  plaque_id: number;
  visited_at: string;
  notes: string;
  photos: string[];
  rating: number;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  achievement?: string;
}

// Define achievements that can be earned
const ACHIEVEMENTS = [
  { 
    id: 'first_visit', 
    title: 'First Steps',
    description: 'Visit your first plaque',
    icon: '🏆'
  },
  { 
    id: 'history_buff', 
    title: 'History Buff',
    description: 'Visit 5 plaques',
    icon: '📚',
    threshold: 5
  },
  { 
    id: 'explorer', 
    title: 'Urban Explorer',
    description: 'Visit 10 plaques',
    icon: '🧭',
    threshold: 10
  },
  { 
    id: 'blue_collector', 
    title: 'Blue Collector',
    description: 'Visit 5 blue plaques',
    icon: '🔵',
    condition: (plaque: Plaque) => plaque.color?.toLowerCase() === 'blue',
    threshold: 5
  },
  { 
    id: 'author_enthusiast', 
    title: 'Literary Explorer',
    description: 'Visit 3 plaques of authors',
    icon: '✒️',
    condition: (plaque: Plaque) => plaque.profession?.toLowerCase() === 'author' || 
                                   plaque.profession?.toLowerCase() === 'writer',
    threshold: 3
  },
  { 
    id: 'photographer', 
    title: 'Documentarian',
    description: 'Add photos to 3 plaque visits',
    icon: '📷',
    metaCondition: (visit: VisitData) => visit.photos && visit.photos.length > 0,
    threshold: 3
  }
];

type VisitLoggerProps = {
  plaque: Plaque | null;
  isOpen: boolean;
  onClose: () => void;
  onVisitLogged: (visitData: VisitData) => void;
  userVisits?: VisitData[];
  verifyLocation?: boolean;
};

const VisitLogger: React.FC<VisitLoggerProps> = ({
  plaque,
  isOpen,
  onClose,
  onVisitLogged,
  userVisits = [],
  verifyLocation = false // Default changed to false
}) => {
  // Visit data state
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number, accuracy: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [showAchievement, setShowAchievement] = useState<{id: string, title: string, description: string, icon: string} | null>(null);
  const { markAsVisited } = useVisitedPlaques();

  // Added state for custom visit date
  const [visitDate, setVisitDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Refs
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  // Reset form when plaque changes
  useEffect(() => {
    if (isOpen && plaque) {
      setNotes("");
      setRating(0);
      setPhotos([]);
      setPhotoFiles([]);
      setUserLocation(null);
      setLocationVerified(false);
      setVisitDate(new Date()); // Reset to current date
    }
  }, [isOpen, plaque]);
  
  // Check if location needs to be verified
  const needsLocationVerification = () => {
    if (!verifyLocation) return false;
    if (!plaque?.latitude || !plaque?.longitude) return false;
    return !locationVerified;
  };
  
  // Verify if user is near the plaque
  const verifyUserLocation = () => {
    if (!plaque) return;
    
    setIsLocating(true);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setUserLocation({ latitude, longitude, accuracy });
          
          // Only verify if plaque has coordinates
          if (plaque.latitude && plaque.longitude) {
            // Calculate distance
            const plaqueLat = parseFloat(plaque.latitude as unknown as string);
            const plaqueLng = parseFloat(plaque.longitude as unknown as string);
            
            if (isNaN(plaqueLat) || isNaN(plaqueLng)) {
              // Can't verify - no valid plaque coordinates
              setLocationVerified(true);
              setIsLocating(false);
              return;
            }
            
            const distance = calculateDistance(
              latitude, 
              longitude, 
              plaqueLat, 
              plaqueLng
            );
            
            // Verify if within 100 meters (adjustable threshold)
            const isNearby = distance <= 0.1; // 100 meters = 0.1 km
            setLocationVerified(isNearby);
            
if (isNearby) {
  toast.success("Location verified! You are near the plaque.");
} else {
  toast.info(`You appear to be ${Math.round(distance * 1000)}m away from the plaque.`);
}
          } else {
            // If plaque has no coordinates, we can't verify - just accept
            setLocationVerified(true);
          }
          
          setIsLocating(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsLocating(false);
          
          // Notify user
          toast.error("Couldn't get your location. You can still log a visit manually.");
          
          // Allow visit without verification if cannot get location
          setLocationVerified(true);
        }
      );
    } else {
      setIsLocating(false);
      toast.error("Geolocation is not supported by your browser. You can still log a visit manually.");
      setLocationVerified(true);
    }
  };
  
  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };
  
  // Handle photo upload
  const handlePhotoUpload = () => {
    photoInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Store file references
    const newPhotoFiles = [...photoFiles];
    
    // Create object URLs for preview
    const newPhotos = [...photos];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file is an image
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} is not an image`);
        continue;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large (max 5MB)`);
        continue;
      }
      
      newPhotoFiles.push(file);
      newPhotos.push(URL.createObjectURL(file));
    }
    
    setPhotoFiles(newPhotoFiles);
    setPhotos(newPhotos);
    
    // Reset input value to allow selecting the same file again
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };
  
  // Remove photo
  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    const newPhotoFiles = [...photoFiles];
    
    // Release object URL to prevent memory leaks
    URL.revokeObjectURL(newPhotos[index]);
    
    newPhotos.splice(index, 1);
    newPhotoFiles.splice(index, 1);
    
    setPhotos(newPhotos);
    setPhotoFiles(newPhotoFiles);
  };
  
  // Set rating
  const handleSetRating = (value: number) => {
    setRating(prev => (prev === value) ? 0 : value);
  };
  
  // Handle date selection
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setVisitDate(date);
      setShowDatePicker(false);
    }
  };

  // Check for achievements
  const checkForAchievements = (visitData: VisitData): string | null => {
    // Create a new array with the current visit added
    const allVisits = [...userVisits, visitData];
    
    // Check for first visit
    if (allVisits.length === 1) {
      return 'first_visit';
    }
    
    // Check for visit count achievements
    const visitCount = allVisits.length;
    if (visitCount === 5) return 'history_buff';
    if (visitCount === 10) return 'explorer';
    
    // Check for blue plaques achievement
    if (plaque?.color?.toLowerCase() === 'blue') {
      const bluePlaqueVisits = allVisits.filter(v => {
        const visitedPlaque = userVisits.find(uv => uv.plaque_id === v.plaque_id);
        return visitedPlaque?.color?.toLowerCase() === 'blue';
      });
      
      if (bluePlaqueVisits.length === 5) return 'blue_collector';
    }
    
    // Check for author plaques
    if (plaque?.profession?.toLowerCase() === 'author' || plaque?.profession?.toLowerCase() === 'writer') {
      const authorPlaqueVisits = allVisits.filter(v => {
        const visitedPlaque = userVisits.find(uv => uv.plaque_id === v.plaque_id);
        return visitedPlaque?.profession?.toLowerCase() === 'author' || 
               visitedPlaque?.profession?.toLowerCase() === 'writer';
      });
      
      if (authorPlaqueVisits.length === 3) return 'author_enthusiast';
    }
    
    // Check for photos achievement
    if (visitData.photos && visitData.photos.length > 0) {
      const visitsWithPhotos = allVisits.filter(v => v.photos && v.photos.length > 0);
      if (visitsWithPhotos.length === 3) return 'photographer';
    }
    
    return null;
  };
  
  // Submit visit
const submitVisit = async () => {
  if (!plaque) return;
  
  if (needsLocationVerification() && !locationVerified) {
    toast.error("Please verify your location first");
    return;
  }
  
  try {
    // Create visit data
    const visitData: VisitData = {
      plaque_id: plaque.id,
      visited_at: visitDate.toISOString(),
      notes,
      photos,
      rating,
      location: userLocation || undefined
    };
    
    // Save to Firebase via the hook
    await markAsVisited(plaque.id, {
      visitedAt: visitData.visited_at,
      notes: visitData.notes
    });
    
    // Check for achievements
    const achievementId = checkForAchievements(visitData);
    if (achievementId) {
      const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
      if (achievement) {
        visitData.achievement = achievementId;
        setShowAchievement(achievement);
      }
    }
    
    // Call the callback to notify parent component
    if (onVisitLogged) {
      onVisitLogged(visitData);
    }
    
    // If no achievement to show, close the sheet
    if (!achievementId) {
      onClose();
    }
    
    toast.success("Visit logged successfully");
  } catch (error) {
    console.error("Error saving visit:", error);
    toast.error("Failed to save visit");
  }
};
  
  // Share visit to social media
  const shareVisit = () => {
    if (!plaque) return;
    
    // Create share text
    const shareText = `I just visited a plaque for "${plaque.title}" in London using Plaquer!`;
    const shareUrl = `https://plaquer.app/plaque/${plaque.id}`;
    
    // Check if Web Share API is available
    if (navigator.share) {
      navigator.share({
        title: 'My Plaque Visit',
        text: shareText,
        url: shareUrl
      })
      .then(() => {
        toast.success("Shared successfully!");
      })
      .catch((error) => {
        console.error('Error sharing:', error);
        
        // Fallback to clipboard
        copyToClipboard(`${shareText} ${shareUrl}`);
      });
    } else {
      // Fallback to clipboard
      copyToClipboard(`${shareText} ${shareUrl}`);
    }
  };
  
  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success("Copied to clipboard! You can paste it anywhere.");
      })
      .catch(() => {
        toast.error("Could not copy to clipboard");
      });
  };
  
  // Close achievement modal and finish
  const closeAchievement = () => {
    setShowAchievement(null);
    onClose();
  };
  
  if (!plaque) return null;
  
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh] sm:max-w-md sm:h-full sm:right-0 sm:left-auto">
        {!showAchievement ? (
          <>
            <SheetHeader>
              <SheetTitle>Log Visit to {plaque.title}</SheetTitle>
            </SheetHeader>
            
            <div className="py-4 space-y-6 overflow-y-auto max-h-[calc(100vh-180px)]">
              {/* Visit Date Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">When did you visit this plaque?</label>
                <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
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
                      onSelect={handleDateChange}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Location verification (if needed) */}
              {needsLocationVerification() && (
                <div className={`p-4 rounded-lg ${locationVerified ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                  <h3 className="font-medium flex items-center gap-2 mb-2">
                    <MapPin size={16} />
                    Verify Your Location
                  </h3>
                  
                  {locationVerified ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <Check size={16} />
                      <span>Location verified!</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm mb-3">
                        To confirm your visit, please verify that you are near the plaque.
                      </p>
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={verifyUserLocation}
                        disabled={isLocating}
                      >
                        {isLocating ? (
                          <>
                            <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin mr-2"></div>
                            Checking location...
                          </>
                        ) : (
                          <>
                            <MapPin size={16} className="mr-2" />
                            Verify My Location
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              )}
              
              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes about your visit:</label>
                <Textarea
                  placeholder="What did you find interesting about this plaque?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              
              {/* Rating */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Your rating:</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Button 
                      key={value}
                      variant="ghost" 
                      size="sm"
                      className={`px-2 ${rating >= value ? 'text-amber-500' : 'text-gray-300'}`}
                      onClick={() => handleSetRating(value)}
                    >
                      <Star size={20} className={rating >= value ? 'fill-amber-500' : ''} />
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Photos */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Photos:</label>
                
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square bg-gray-100 rounded-md overflow-hidden">
                      <img 
                        src={photo} 
                        alt={`Visit photo ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => removePhoto(index)}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ))}
                  
                  {/* Add photo button */}
                  <Button 
                    variant="outline" 
                    className="aspect-square flex flex-col items-center justify-center gap-1 p-0"
                    onClick={handlePhotoUpload}
                  >
                    <Plus size={18} />
                    <span className="text-xs">Add Photo</span>
                  </Button>
                </div>
                
                <input
                  type="file"
                  ref={photoInputRef}
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                />
              </div>
              
              {/* Share options */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Share your visit:</label>
                <Button 
                  variant="outline" 
                  className="w-full flex items-center gap-2"
                  onClick={shareVisit}
                >
                  <Share2 size={16} />
                  Share to Social Media
                </Button>
              </div>
            </div>
            
            <SheetFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={submitVisit}>
                Log Visit
              </Button>
            </SheetFooter>
          </>
        ) : (
          // Achievement unlock screen
          <div className="h-full flex flex-col items-center justify-center px-4 py-6">
            <div className="animate-bounce text-4xl mb-4">
              {showAchievement.icon}
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-2">
              Achievement Unlocked!
            </h2>
            
            <h3 className="text-xl font-semibold text-blue-600 mb-6 text-center">
              {showAchievement.title}
            </h3>
            
            <p className="text-gray-600 mb-10 text-center">
              {showAchievement.description}
            </p>
            
            <div className="space-y-3 w-full max-w-xs">
              <Button 
                variant="default" 
                className="w-full"
                onClick={shareVisit}
              >
                <Share2 size={16} className="mr-2" />
                Share Achievement
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={closeAchievement}
              >
                Continue
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default VisitLogger;