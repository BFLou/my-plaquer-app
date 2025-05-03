import React, { useState } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter,
  SheetDescription
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CheckCircle } from 'lucide-react';

export type NewCollection = {
  name: string;
  description: string;
  icon: string;
  color: string;
  isPublic?: boolean;
};

type CollectionCreatorProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (collection: NewCollection) => void;
  initialValues?: Partial<NewCollection>;
  title?: string;
  submitLabel?: string;
  isEdit?: boolean;
};

const CollectionCreator = ({
  isOpen,
  onClose,
  onSave,
  initialValues,
  title = "Create New Collection",
  submitLabel = "Create Collection",
  isEdit = false
}: CollectionCreatorProps) => {
  const [name, setName] = useState(initialValues?.name || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [selectedIcon, setSelectedIcon] = useState(initialValues?.icon || '🎭');
  const [selectedColor, setSelectedColor] = useState(initialValues?.color || 'bg-blue-500');
  const [isPublic, setIsPublic] = useState(initialValues?.isPublic || false);
  
  // Fun and playful icon set
  const icons = ['🦄', '🌈', '🪷', '🌵', '🍦', '🧁', '🎠', '🎨', '🦋', '🐳', '🍭', '🎡', '🌻', '🌮', '🧸', '🪩', '🎁', '🧩', '🎯', '🧠'];
  
  // Pastel color options
  const colors = [
    { name: 'Sky', value: 'bg-sky-300' },
    { name: 'Mint', value: 'bg-teal-200' },
    { name: 'Lavender', value: 'bg-purple-200' },
    { name: 'Peach', value: 'bg-orange-200' },
    { name: 'Coral', value: 'bg-rose-200' },
    { name: 'Butter', value: 'bg-yellow-200' },
    { name: 'Blush', value: 'bg-pink-200' },
    { name: 'Seafoam', value: 'bg-emerald-200' },
    { name: 'Lilac', value: 'bg-violet-200' },
    { name: 'Lemon', value: 'bg-amber-200' },
    { name: 'Sage', value: 'bg-green-200' },
    { name: 'Cotton', value: 'bg-blue-200' },
  ];
  
  const handleSubmit = () => {
    if (!name.trim()) return;
    
    onSave({
      name,
      description,
      icon: selectedIcon,
      color: selectedColor,
      isPublic
    });
    
    // Reset form
    if (!isEdit) {
      setName('');
      setDescription('');
      setSelectedIcon('🎭');
      setSelectedColor('bg-blue-500');
      setIsPublic(false);
    }
  };

  const handleSheetChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };
  
  // Function to extract color name for preview
  const getColorName = (colorClass) => {
    return colorClass.replace('bg-', '').replace('-500', '');
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={handleSheetChange}>
      <SheetContent side="right" className="sm:max-w-md w-full">
        <SheetHeader className="border-b pb-4">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Create a new collection to organize your plaques</SheetDescription>
        </SheetHeader>
        
        <div className="py-6 space-y-6 overflow-y-auto max-h-[calc(100vh-180px)]">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base">Collection Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Literary London"
              className="w-full"
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this collection about?"
              className="w-full"
              rows={3}
            />
          </div>
          
          <div className="space-y-3">
            <Label className="text-base">Choose an Icon</Label>
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-3">
              {icons.map((icon) => (
                <div 
                  key={icon}
                  onClick={() => setSelectedIcon(icon)}
                  className={`w-10 h-10 rounded-full ${selectedColor} flex items-center justify-center text-white text-xl cursor-pointer ${selectedIcon === icon ? 'ring-2 ring-offset-2 ring-blue-400' : ''} hover:scale-110 transition-transform`}
                >
                  {icon}
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <Label className="text-base">Choose a Color</Label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {colors.map((color) => (
                <div 
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className="relative"
                >
                  <div className={`w-full h-12 rounded-lg ${color.value} cursor-pointer ${selectedColor === color.value ? 'ring-2 ring-offset-2 ring-blue-400' : ''} hover:scale-105 transition-transform`}>
                  </div>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                    {color.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div className="space-y-1">
              <Label htmlFor="public-switch" className="text-base">Make this collection public</Label>
              <p className="text-sm text-gray-500">Public collections can be shared with anyone</p>
            </div>
            <Switch
              id="public-switch"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
          
          {/* Preview */}
          <div className="pt-2 pb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Preview</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 rounded-lg ${selectedColor} flex items-center justify-center text-white text-3xl shadow-sm`}>
                  {selectedIcon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{name || "Your Collection Name"}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{description || "Collection description will appear here"}</p>
                  {isPublic && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        <CheckCircle size={12} className="mr-1" /> Public
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <SheetFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!name.trim()} 
            className="w-full sm:w-auto"
          >
            {submitLabel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export { CollectionCreator };


