// src/components/collections/forms/CollectionCreateForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Available icons and colors with improved selection and visual design
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
};

type CollectionCreateFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CollectionFormData) => void;
  isLoading?: boolean;
  initialValues?: Partial<CollectionFormData>;
  submitLabel?: string;
  title?: string;
};

const CollectionCreateForm: React.FC<CollectionCreateFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  initialValues = {},
  submitLabel = "Create Collection",
  title = "Create New Collection"
}) => {
  // Use a ref to track initialization
  const isInitializedRef = useRef(false);
  
  // Form state
  const [formState, setFormState] = useState<CollectionFormData>({
    name: initialValues.name || '',
    description: initialValues.description || '',
    icon: initialValues.icon || '📚',
    color: initialValues.color || 'bg-blue-500'
  });
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Initialize form state when it opens or when initialValues change
  // Using a different approach to avoid the infinite loop
  useEffect(() => {
    if (isOpen && !isInitializedRef.current) {
      isInitializedRef.current = true;
      
      // Set the initial values when the dialog opens
      setFormState({
        name: initialValues.name || '',
        description: initialValues.description || '',
        icon: initialValues.icon || '📚',
        color: initialValues.color || 'bg-blue-500'
      });
      
      // Reset validation states
      setErrors({});
      setTouched({});
    } else if (!isOpen) {
      // Reset the initialization flag when the dialog closes
      isInitializedRef.current = false;
    }
  }, [isOpen, initialValues]);
  
  // Update form state - Fixed parameter types
  const handleChange = (field: keyof CollectionFormData, value: string) => {
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
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  // Handle form submission - Fixed parameter type
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate form - Fixed error object typing
    const newErrors: Record<string, string> = {};
    
    if (!formState.name.trim()) {
      newErrors.name = 'Collection name is required';
    } else if (formState.name.length > 50) {
      newErrors.name = 'Name must be less than 50 characters';
    }
    
    if (formState.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    setErrors(newErrors);
    
    // Mark all fields as touched - Fixed typing
    const allTouched: Record<string, boolean> = Object.keys(formState).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    
    setTouched(allTouched);
    
    // Submit if no errors
    if (Object.keys(newErrors).length === 0) {
      onSubmit(formState);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            {title} form
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-6">
            {/* Collection Name and Description */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-medium">
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
                <p className="text-xs text-gray-500">{formState.name.length}/50 characters</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-medium">
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  value={formState.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Add a description for your collection..."
                  className={`w-full ${errors.description && touched.description ? 'border-red-500' : ''}`}
                  rows={3}
                />
                {errors.description && touched.description && (
                  <p className="text-red-500 text-xs mt-1">{errors.description}</p>
                )}
                <p className="text-xs text-gray-500">{formState.description.length}/500 characters</p>
              </div>
            </div>
            
            {/* Icon Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Choose an Icon</Label>
              <div className="grid grid-cols-6 sm:grid-cols-9 gap-3">
                {icons.map((icon) => (
                  <div 
                    key={icon}
                    onClick={() => !isLoading && handleChange('icon', icon)}
                    className={`h-10 w-10 rounded-full cursor-pointer flex items-center justify-center text-xl ${formState.color} ${
                      formState.icon === icon ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                    } transition-transform hover:scale-110 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {icon}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Color Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Choose a Color</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {colors.map((color) => (
                  <div 
                    key={color.value}
                    onClick={() => !isLoading && handleChange('color', color.value)}
                    className="relative"
                  >
                    <div className={`w-full h-12 rounded-lg ${color.value} cursor-pointer ${
                      formState.color === color.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                    } hover:scale-105 transition-transform ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    </div>
                    <span className={`absolute inset-0 flex items-center justify-center text-sm font-medium ${color.textColor}`}>
                      {color.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Preview */}
            <div className="rounded-lg bg-gray-50 p-4 mt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Preview</h3>
              <div className={`p-4 bg-white rounded-lg shadow-sm border ${isLoading ? 'opacity-70' : ''}`}>
                <div className="flex gap-4 items-start">
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-white text-3xl ${formState.color}`}>
                    {formState.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{formState.name || "Collection Name"}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{formState.description || "Collection description will appear here"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formState.name.trim()}
            >
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                  Processing...
                </>
              ) : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CollectionCreateForm;