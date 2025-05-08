import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Define types for the form
export type CollectionFormData = {
  name: string;
  description: string;
  icon: string;
  color: string;
  isPublic?: boolean;
};

type CollectionFormProps = {
  initialValues?: Partial<CollectionFormData>;
  onSubmit: (data: CollectionFormData) => void;
  onCancel?: () => void;
  submitLabel?: string;
  className?: string;
};

export const CollectionForm: React.FC<CollectionFormProps> = ({
  initialValues = {},
  onSubmit,
  onCancel,
  submitLabel = "Create Collection",
  className = ''
}) => {
  // Form state
  const [formState, setFormState] = useState<CollectionFormData>({
    name: initialValues.name || '',
    description: initialValues.description || '',
    icon: initialValues.icon || '🎭',
    color: initialValues.color || 'bg-blue-500',
    isPublic: initialValues.isPublic || false
  });
  
  // Form validation state
  const [errors, setErrors] = useState<Partial<Record<keyof CollectionFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof CollectionFormData, boolean>>>({});
  
  // Available icons and colors
  const icons = ['🎭', '🎶', '📚', '🏛️', '🏙️', '🌟', '🧠', '🏆', '🧪', '🎨', '🌍', '🎓', '🏺', '⚔️', '🎬', '🚀',
               '🦄', '🌈', '🪷', '🌵', '🍦', '🧁', '🎠', '🦋', '🐳', '🍭', '🎡', '🌻', '🌮', '🧸', '🪩', '🎁'];
  
  const colors = [
    { name: 'Blue', value: 'bg-blue-500' },
    { name: 'Green', value: 'bg-green-500' },
    { name: 'Red', value: 'bg-red-500' },
    { name: 'Yellow', value: 'bg-yellow-500' },
    { name: 'Purple', value: 'bg-purple-500' },
    { name: 'Pink', value: 'bg-pink-500' },
    { name: 'Indigo', value: 'bg-indigo-500' },
    { name: 'Teal', value: 'bg-teal-500' },
    { name: 'Orange', value: 'bg-orange-500' },
    { name: 'Amber', value: 'bg-amber-500' },
    { name: 'Lime', value: 'bg-lime-500' },
    { name: 'Emerald', value: 'bg-emerald-500' },
  ];
  
  // Update form state when initialValues change
  useEffect(() => {
    if (initialValues) {
      setFormState(prev => ({
        ...prev,
        ...initialValues
      }));
    }
  }, [initialValues]);
  
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
  
  // Validate the form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CollectionFormData, string>> = {};
    
    // Name is required
    if (!formState.name.trim()) {
      newErrors.name = 'Collection name is required';
    }
    
    setErrors(newErrors);
    
    // Form is valid if there are no errors
    return Object.keys(newErrors).length === 0;
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
  
  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
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
          autoFocus
        />
        {errors.name && touched.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description" className="text-base">Description (optional)</Label>
        <Textarea
          id="description"
          value={formState.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="What's this collection about?"
          className="w-full"
          rows={3}
        />
      </div>
      
      <div className="space-y-3">
        <Label className="text-base">Choose an Icon</Label>
        <div className="grid grid-cols-8 gap-3">
          {icons.map((icon) => (
            <div 
              key={icon}
              onClick={() => handleChange('icon', icon)}
              className={`w-10 h-10 rounded-full ${formState.color} flex items-center justify-center text-white text-xl cursor-pointer ${formState.icon === icon ? 'ring-2 ring-offset-2 ring-blue-400' : ''} hover:scale-110 transition-transform`}
            >
              {icon}
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-3">
        <Label className="text-base">Choose a Color</Label>
        <div className="grid grid-cols-6 gap-3">
          {colors.map((color) => (
            <div 
              key={color.value}
              onClick={() => handleChange('color', color.value)}
              className="relative"
            >
              <div className={`w-full h-12 rounded-lg ${color.value} cursor-pointer ${formState.color === color.value ? 'ring-2 ring-offset-2 ring-blue-400' : ''} hover:scale-105 transition-transform`}>
              </div>
              <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium">
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
          checked={formState.isPublic}
          onCheckedChange={(checked) => handleChange('isPublic', checked)}
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
              {formState.isPublic && (
                <div className="mt-2">
                  <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 flex items-center gap-1 w-fit">
                    <Star size={12} /> Public
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit"
          disabled={!formState.name.trim()}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default CollectionForm;