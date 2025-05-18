// src/features/collections/components/forms/CollectionEditForm.tsx
import React, { useState, useEffect } from 'react';
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X } from 'lucide-react';
import { Collection } from '../CollectionCard';

// Available icons and colors with improved selection
const icons = [
  '🎭', '🎶', '📚', '🏛️', '🏙️', '🌟', '🧠', '🏆', '🧪', '🎨', '🌍', '🎓', 
  '🏺', '⚔️', '🎬', '🚀', '🦄', '🌈', '🪷', '🌵', '🍦', '🧁', '🎠', '🦋', 
  '🐳', '🍭', '🎡', '🌻', '🌮', '🧸', '🪩', '🎁', '💡', '🔍', '📷', '📱'
];

const colors = [
  { name: 'Blue', value: 'bg-blue-500', textColor: 'text-white' },
  { name: 'Green', value: 'bg-green-500', textColor: 'text-white' },
  { name: 'Red', value: 'bg-red-500', textColor: 'text-white' },
  { name: 'Yellow', value: 'bg-yellow-500', textColor: 'text-black' },
  { name: 'Purple', value: 'bg-purple-500', textColor: 'text-white' },
  { name: 'Pink', value: 'bg-pink-500', textColor: 'text-white' },
  { name: 'Indigo', value: 'bg-indigo-500', textColor: 'text-white' },
  { name: 'Teal', value: 'bg-teal-500', textColor: 'text-white' },
  { name: 'Orange', value: 'bg-orange-500', textColor: 'text-white' },
  { name: 'Amber', value: 'bg-amber-500', textColor: 'text-black' },
  { name: 'Lime', value: 'bg-lime-500', textColor: 'text-black' },
  { name: 'Emerald', value: 'bg-emerald-500', textColor: 'text-white' },
];

export type CollectionFormData = {
  name: string;
  description: string;
  icon: string;
  color: string;
  tags?: string[];
  isPublic?: boolean;
};

type CollectionEditFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CollectionFormData) => void;
  isLoading: boolean;
  collection: Collection | null;
};

const CollectionEditForm: React.FC<CollectionEditFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  collection
}) => {
  // Form state
  const [formState, setFormState] = useState<CollectionFormData>({
    name: '',
    description: '',
    icon: '🎭',
    color: 'bg-blue-500',
    tags: [],
    isPublic: false
  });
  
  // Initialize form with collection data when it changes
  useEffect(() => {
    if (collection) {
      setFormState({
        name: collection.name || '',
        description: collection.description || '',
        icon: collection.icon || '🎭',
        color: collection.color || 'bg-blue-500',
        tags: collection.tags || [],
        isPublic: collection.isPublic || false
      });
    }
  }, [collection]);
  
  // Validation state
  const [errors, setErrors] = useState<Partial<Record<keyof CollectionFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof CollectionFormData, boolean>>>({});
  const [tagInput, setTagInput] = useState('');
  
  // Update a single field
  const handleChange = (field: keyof CollectionFormData, value: any) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
    
    // Clear error when value changes
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };
  
  // Handle tag input
  const handleAddTag = () => {
    if (tagInput.trim() && !formState.tags?.includes(tagInput.trim())) {
      setFormState(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    setFormState(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || []
    }));
  };
  
  // Validate the form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CollectionFormData, string>> = {};
    
    // Name is required
    if (!formState.name.trim()) {
      newErrors.name = 'Collection name is required';
    } else if (formState.name.length > 50) {
      newErrors.name = 'Name must be less than 50 characters';
    }
    
    // Description has max length
    if (formState.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    setErrors(newErrors);
    
    // Form is valid if there are no errors
    return Object.keys(newErrors).length === 0;
  };

  // Reset form to current collection data
  const resetForm = () => {
    if (collection) {
      setFormState({
        name: collection.name || '',
        description: collection.description || '',
        icon: collection.icon || '🎭',
        color: collection.color || 'bg-blue-500',
        tags: collection.tags || [],
        isPublic: collection.isPublic || false
      });
    }
    setErrors({});
    setTouched({});
    setTagInput('');
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = Object.keys(formState).reduce((acc, key) => {
      acc[key as keyof CollectionFormData] = true;
      return acc;
    }, {} as Record<keyof CollectionFormData, boolean>);
    
    setTouched(allTouched);
    
    // Validate form
    if (validateForm()) {
      onSubmit(formState);
    }
  };
  
  // If no collection provided, return null
  if (!collection) return null;
  
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Collection</SheetTitle>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base">
              Collection Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formState.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Literary London"
              className={`w-full ${errors.name && touched.name ? 'border-red-500' : ''}`}
              disabled={isLoading}
              autoFocus
            />
            {errors.name && touched.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
            <p className="text-gray-500 text-xs">
              {formState.name.length}/50 characters
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base">Description (optional)</Label>
            <Textarea
              id="description"
              value={formState.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="What's this collection about?"
              className={`w-full ${errors.description && touched.description ? 'border-red-500' : ''}`}
              disabled={isLoading}
              rows={3}
            />
            {errors.description && touched.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
            <p className="text-gray-500 text-xs">
              {formState.description.length}/500 characters
            </p>
          </div>
          
          <div className="space-y-3">
            <Label className="text-base">Choose an Icon</Label>
            <div className="grid grid-cols-8 sm:grid-cols-9 gap-3">
              {icons.map((icon) => (
                <div 
                  key={icon}
                  onClick={() => !isLoading && handleChange('icon', icon)}
                  className={`w-10 h-10 rounded-full ${formState.color} flex items-center justify-center text-white text-xl cursor-pointer ${
                    formState.icon === icon ? 'ring-2 ring-offset-2 ring-blue-400' : ''
                  } hover:scale-110 transition-transform ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {icon}
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <Label className="text-base">Choose a Color</Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {colors.map((color) => (
                <div 
                  key={color.value}
                  onClick={() => !isLoading && handleChange('color', color.value)}
                  className="relative"
                >
                  <div className={`w-full h-12 rounded-lg ${color.value} cursor-pointer ${
                    formState.color === color.value ? 'ring-2 ring-offset-2 ring-blue-400' : ''
                  } hover:scale-105 transition-transform ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  </div>
                  <span className={`absolute inset-0 flex items-center justify-center text-sm font-medium ${color.textColor}`}>
                    {color.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Tags */}
          <div className="space-y-3">
            <Label className="text-base">Tags (optional)</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formState.tags && formState.tags.length > 0 ? (
                formState.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button 
                      type="button" 
                      className="ml-1 hover:text-red-500"
                      onClick={() => handleRemoveTag(tag)}
                      disabled={isLoading}
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ))
              ) : (
                <span className="text-gray-400 text-sm">No tags added yet</span>
              )}
            </div>
            <div className="flex gap-2">
              <Input 
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                disabled={isLoading}
              />
              <Button 
                type="button" 
                onClick={handleAddTag}
                disabled={!tagInput.trim() || isLoading}
              >
                Add
              </Button>
            </div>
          </div>
          
          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isPublic" className="text-base">Public Collection</Label>
              <p className="text-sm text-gray-500">Anyone with the link can view this collection</p>
            </div>
            <Switch
              id="isPublic"
              checked={formState.isPublic}
              onCheckedChange={(checked) => handleChange('isPublic', checked)}
              disabled={isLoading}
            />
          </div>
          
          {/* Preview */}
          <div className="pt-2 pb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Preview</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 rounded-lg ${formState.color} flex items-center justify-center text-white text-3xl shadow-sm`}>
                  {formState.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{formState.name || "Your Collection Name"}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{formState.description || "Collection description will appear here"}</p>
                  
                  {formState.tags && formState.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formState.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <SheetFooter className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                resetForm();
                onClose();
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!formState.name.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                  Saving...
                </>
              ) : 'Save Changes'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default CollectionEditForm;