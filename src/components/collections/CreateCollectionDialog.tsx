// src/components/collections/CreateCollectionDialog.tsx
import { useState } from 'react';
import { useCollections } from '@/hooks/useCollections';
import { useAuth } from '@/hooks/useAuth';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  Button,
  Input,
  Textarea,
  Label,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui';
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
  const [isPublic, setIsPublic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // List of icons to choose from
  const icons = ['📍', '🔍', '🏛️', '🏠', '🌆', '📚', '🎭', '🎨', '🎵', '🔬', '⚔️', '👑', '🏆', '⭐'];
  
  // List of colors to choose from
  const colors = [
    { value: 'blue-500', label: 'Blue' },
    { value: 'green-500', label: 'Green' },
    { value: 'red-500', label: 'Red' },
    { value: 'purple-500', label: 'Purple' },
    { value: 'amber-500', label: 'Amber' },
    { value: 'pink-500', label: 'Pink' },
    { value: 'indigo-500', label: 'Indigo' },
    { value: 'gray-500', label: 'Gray' }
  ];
  
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
        isPublic,
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Collection</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Collection Name</Label>
            <Input
              id="name"
              placeholder="My Blue Plaques"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a description for your collection..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {icons.map((iconOption) => (
                    <SelectItem key={iconOption} value={iconOption}>
                      <span className="text-lg mr-2">{iconOption}</span> {iconOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isPublic">Make Public</Label>
              <p className="text-sm text-gray-500">Allow others to view this collection</p>
            </div>
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
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
        
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating}>
            {isCreating ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                Creating...
              </>
            ) : 'Create Collection'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCollectionDialog;