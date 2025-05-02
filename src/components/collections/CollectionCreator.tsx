import React, { useState } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export type NewCollection = {
  name: string;
  description: string;
  icon: string;
  color: string;
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

export const CollectionCreator = ({
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
  
  const icons = ['🎭', '🎶', '📚', '🏛️', '🏙️', '🌟', '🧠', '🏆', '🧪', '🎨'];
  const colors = [
    { name: 'Blue', value: 'bg-blue-500' },
    { name: 'Green', value: 'bg-green-500' },
    { name: 'Red', value: 'bg-red-500' },
    { name: 'Yellow', value: 'bg-yellow-500' },
    { name: 'Purple', value: 'bg-purple-500' },
    { name: 'Pink', value: 'bg-pink-500' },
    { name: 'Indigo', value: 'bg-indigo-500' },
    { name: 'Teal', value: 'bg-teal-500' },
  ];
  
  const handleSubmit = () => {
    if (!name.trim()) return;
    
    onSave({
      name,
      description,
      icon: selectedIcon,
      color: selectedColor
    });
    
    // Reset form
    if (!isEdit) {
      setName('');
      setDescription('');
      setSelectedIcon('🎭');
      setSelectedColor('bg-blue-500');
    }
  };

  const handleSheetChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={handleSheetChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        
        <div className="py-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Collection Name</Label>
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
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this collection about?"
              className="w-full"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Choose an Icon</Label>
            <div className="grid grid-cols-5 gap-2">
              {icons.map((icon) => (
                <div 
                  key={icon}
                  onClick={() => setSelectedIcon(icon)}
                  className={`w-10 h-10 rounded-full ${selectedColor} flex items-center justify-center text-white text-xl cursor-pointer ${selectedIcon === icon ? 'ring-2 ring-offset-2 ring-blue-600' : ''}`}
                >
                  {icon}
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Choose a Color</Label>
            <div className="grid grid-cols-4 gap-2">
              {colors.map((color) => (
                <div 
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className="relative"
                >
                  <div className={`w-full h-10 rounded-lg ${color.value} cursor-pointer ${selectedColor === color.value ? 'ring-2 ring-offset-2 ring-blue-600' : ''}`}>
                  </div>
                  <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                    {color.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <SheetFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>{submitLabel}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default CollectionCreator;