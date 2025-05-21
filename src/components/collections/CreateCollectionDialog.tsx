import { useState } from 'react';
import { useCollections } from '../../hooks/useCollection';
import { useAuth } from '@/hooks/useAuth';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Plaque } from '@/types/plaque';
import { toast } from 'sonner';


// Create Collection dialog component that can optionally add plaques
interface CreateCollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlaques?: Plaque[]; // Optional initial plaques to add
}

const CreateCollectionDialog = ({ isOpen, onClose, initialPlaques = [] }: CreateCollectionDialogProps) => {
  const { user } = useAuth();
  const { createCollection } = useCollections();
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📍'); // Default icon
  const [color, setColor] = useState('blue-500'); // Default color
  const [isCreating, setIsCreating] = useState(false);
  
  // List of icons to choose from - expanded selection
  const icons = ['📍', '🔍', '🏛️', '🏠', '🌆', '📚', '🎭', '🎨', '🎵', '🔬', '⚔️', '👑', '🏆', '⭐', '🌟', '🧠', '💡', '🏺', '🗺️', '🏙️'];
  
  // List of colors to choose from
  const colors = [
    { value: 'blue-500', label: 'Blue' },
    { value: 'green-500', label: 'Green' },
    { value: 'red-500', label: 'Red' },
    { value: 'purple-500', label: 'Purple' },
    { value: 'amber-500', label: 'Amber' },
    { value: 'pink-500', label: 'Pink' },
    { value: 'indigo-500', label: 'Indigo' },
    { value: 'gray-500', label: 'Gray' },
    { value: 'teal-500', label: 'Teal' },
    { value: 'cyan-500', label: 'Cyan' }
  ];
  
  // Reset form when dialog closes
  const handleDialogChange = (open: boolean) => {
    if (!open) {
      // Reset after a short delay to prevent visual glitches
      setTimeout(() => {
        setName('');
        setDescription('');
        setIcon('📍');
        setColor('blue-500');
      }, 200);
      onClose();
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to create collections');
      onClose();
      return;
    }
    
    if (!name.trim()) {
      toast.error('Please enter a name for your collection');
      return;
    }
    
    setIsCreating(true);
    try {
      // Extract plaque IDs from initialPlaques
      const plaqueIds = initialPlaques.map(plaque => plaque.id);
      
      await createCollection(
        name,
        icon,
        color,
        description,
        false, // Removing isPublic option
        plaqueIds
      );
      
      toast.success('Collection created successfully');
      onClose();
    } catch (err) {
      console.error('Error creating collection:', err);
      toast.error('Failed to create collection');
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Collection</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-medium">
              Collection Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="My Blue Plaques"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
              autoFocus
            />
            <p className="text-xs text-gray-500">{name.length}/50 characters</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-medium">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Add a description for your collection..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full"
              rows={3}
            />
            <p className="text-xs text-gray-500">{description.length}/200 characters</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon" className="text-base font-medium">
                Icon
              </Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger id="icon" className="w-full">
                  <SelectValue placeholder="Select an icon" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  <div className="grid grid-cols-5 gap-2 p-2">
                    {icons.map((iconOption) => (
                      <SelectItem 
                        key={iconOption} 
                        value={iconOption}
                        className="flex justify-center items-center h-10 cursor-pointer rounded hover:bg-gray-100"
                      >
                        <span className="text-xl">{iconOption}</span>
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="color" className="text-base font-medium">
                Color
              </Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger id="color" className="w-full">
                  <SelectValue placeholder="Select a color" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {colors.map((colorOption) => (
                    <SelectItem key={colorOption.value} value={colorOption.value}>
                      <div className="flex items-center">
                        <div 
                          className={`h-4 w-4 rounded-full bg-${colorOption.value.split('-')[0]}-500 mr-2`}
                        ></div>
                        {colorOption.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Preview */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Preview</h3>
            <div className="flex items-center gap-3 bg-white p-3 rounded-md shadow-sm">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white bg-${color.split('-')[0]}-500`}>
                <span className="text-2xl">{icon}</span>
              </div>
              <div>
                <h3 className="font-medium">{name || "My Collection"}</h3>
                {description && (
                  <p className="text-sm text-gray-500 line-clamp-1">{description}</p>
                )}
              </div>
            </div>
          </div>
          
          {initialPlaques.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium">Adding {initialPlaques.length} plaque(s) to this collection:</p>
              <ul className="mt-2 text-sm text-gray-600 space-y-1 max-h-24 overflow-y-auto">
                {initialPlaques.map(plaque => (
                  <li key={plaque.id} className="truncate">
                    • {plaque.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <DialogFooter className="sm:justify-end gap-2 pt-2 mt-2 border-t">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isCreating}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isCreating || !name.trim()}
            className="w-full sm:w-auto"
          >
            {isCreating ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                Creating...
              </>
            ) : 'Create Collection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCollectionDialog;