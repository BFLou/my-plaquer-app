// src/components/collections/CollectionForm.tsx - MOBILE OPTIMIZED
import React, { useState, useEffect } from 'react';
import { MobileInput } from "@/components/ui/mobile-input";
import { MobileTextarea } from "@/components/ui/mobile-textarea";
import { MobileButton } from "@/components/ui/mobile-button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';
import { useSafeArea } from '@/hooks/useSafeArea';
import { useKeyboardDetection } from '@/hooks/useKeyboardDetection';

export type CollectionFormData = {
  name: string;
  description: string;
  icon: string;
  color: string;
  tags?: string[];
};

type CollectionFormProps = {
  initialValues?: Partial<CollectionFormData>;
  onSubmit: (data: CollectionFormData) => void;
  onCancel?: () => void;
  submitLabel?: string;
  className?: string;
  isLoading?: boolean;
};

export const CollectionForm: React.FC<CollectionFormProps> = ({
  initialValues = {},
  onSubmit,
  onCancel,
  submitLabel = "Create Collection",
  className = '',
  isLoading = false
}) => {
  // Mobile detection and responsive hooks
  const mobile = isMobile();
  const safeArea = useSafeArea();
  const { isKeyboardOpen } = useKeyboardDetection();
  
  // Form state
  const [formState, setFormState] = useState<CollectionFormData>({
    name: initialValues.name || '',
    description: initialValues.description || '',
    icon: initialValues.icon || '🎭',
    color: initialValues.color || 'bg-blue-500',
    tags: initialValues.tags || []
  });
  
  // Form validation state
  const [errors, setErrors] = useState<Partial<Record<keyof CollectionFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof CollectionFormData, boolean>>>({});
  const [tagInput, setTagInput] = useState('');
  
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
    // Add haptic feedback for mobile
    if (mobile) {
      triggerHapticFeedback('selection');
    }
    
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
    if (tagInput.trim() && !formState.tags.includes(tagInput.trim())) {
      if (mobile) {
        triggerHapticFeedback('light');
      }
      setFormState(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    if (mobile) {
      triggerHapticFeedback('light');
    }
    setFormState(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
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
      if (mobile) {
        triggerHapticFeedback('success');
      }
      onSubmit(formState);
    }
  };
  
  return (
    <div 
      className={`${className}`}
      style={{
        paddingBottom: mobile ? Math.max(safeArea.bottom, 20) : undefined
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className={`${mobile ? 'text-lg' : 'text-base'} font-medium`}>
            Collection Name <span className="text-red-500">*</span>
          </Label>
          <MobileInput
            id="name"
            value={formState.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., Literary London"
            className={`w-full ${errors.name && touched.name ? 'border-red-500' : ''}`}
            disabled={isLoading}
            autoFocus={!mobile} // Don't auto-focus on mobile to prevent keyboard pop-up
            preventZoom={true}
          />
          {errors.name && touched.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
          )}
          <p className="text-gray-500 text-xs">
            {formState.name.length}/50 characters
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description" className={`${mobile ? 'text-lg' : 'text-base'} font-medium`}>
            Description (optional)
          </Label>
          <MobileTextarea
            id="description"
            value={formState.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="What's this collection about?"
            className={`w-full ${errors.description && touched.description ? 'border-red-500' : ''}`}
            disabled={isLoading}
            rows={mobile ? 4 : 3}
            preventZoom={true}
          />
          {errors.description && touched.description && (
            <p className="text-red-500 text-xs mt-1">{errors.description}</p>
          )}
          <p className="text-gray-500 text-xs">
            {formState.description.length}/500 characters
          </p>
        </div>
        
        <div className="space-y-3">
          <Label className={`${mobile ? 'text-lg' : 'text-base'} font-medium`}>
            Choose an Icon
          </Label>
          <div className={`grid ${mobile ? 'grid-cols-6 gap-4' : 'grid-cols-8 sm:grid-cols-9 gap-3'}`}>
            {icons.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => !isLoading && handleChange('icon', icon)}
                className={`${mobile ? 'h-14 w-14' : 'h-10 w-10'} rounded-full ${formState.color} flex items-center justify-center text-white ${mobile ? 'text-2xl' : 'text-xl'} cursor-pointer ${
                  formState.icon === icon ? 'ring-2 ring-offset-2 ring-blue-400' : ''
                } hover:scale-110 transition-transform ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${
                  mobile ? 'active:scale-95' : ''
                }`}
                disabled={isLoading}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
          <Label className={`${mobile ? 'text-lg' : 'text-base'} font-medium`}>
            Choose a Color
          </Label>
          <div className={`grid ${mobile ? 'grid-cols-2 gap-4' : 'grid-cols-3 sm:grid-cols-6 gap-3'}`}>
            {colors.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => !isLoading && handleChange('color', color.value)}
                className="relative"
                disabled={isLoading}
              >
                <div className={`w-full ${mobile ? 'h-16' : 'h-12'} rounded-lg ${color.value} cursor-pointer ${
                  formState.color === color.value ? 'ring-2 ring-offset-2 ring-blue-400' : ''
                } hover:scale-105 transition-transform ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${
                  mobile ? 'active:scale-95' : ''
                }`}>
                </div>
                <span className={`absolute inset-0 flex items-center justify-center ${mobile ? 'text-base' : 'text-sm'} font-medium ${color.textColor}`}>
                  {color.name}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Tags */}
        <div className="space-y-3">
          <Label className={`${mobile ? 'text-lg' : 'text-base'} font-medium`}>
            Tags (optional)
          </Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formState.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button 
                  type="button" 
                  className="ml-1 hover:text-red-500"
                  onClick={() => handleRemoveTag(tag)}
                  disabled={isLoading}
                >
                  ×
                </button>
              </Badge>
            ))}
            {formState.tags.length === 0 && (
              <span className="text-gray-400 text-sm">No tags added yet</span>
            )}
          </div>
          <div className={`flex gap-2 ${mobile ? 'flex-col' : ''}`}>
            <MobileInput 
              placeholder="Add a tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              disabled={isLoading}
              className={mobile ? 'mb-2' : 'flex-1'}
              preventZoom={true}
            />
            <MobileButton 
              type="button" 
              onClick={handleAddTag}
              disabled={!tagInput.trim() || isLoading}
              className={mobile ? 'w-full' : ''}
            >
              Add
            </MobileButton>
          </div>
        </div>
        
        {/* Preview */}
        <div className="pt-2 pb-4">
          <h3 className={`${mobile ? 'text-base' : 'text-sm'} font-medium text-gray-500 mb-3`}>
            Preview
          </h3>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-4">
              <div className={`${mobile ? 'w-20 h-20' : 'w-16 h-16'} rounded-lg ${formState.color} flex items-center justify-center text-white ${mobile ? 'text-4xl' : 'text-3xl'} shadow-sm`}>
                {formState.icon}
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold ${mobile ? 'text-xl' : 'text-lg'}`}>
                  {formState.name || "Your Collection Name"}
                </h3>
                <p className={`${mobile ? 'text-base' : 'text-sm'} text-gray-600 line-clamp-2`}>
                  {formState.description || "Collection description will appear here"}
                </p>
                
                {formState.tags.length > 0 && (
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
        
        <div 
          className={`flex ${mobile ? 'flex-col gap-4' : 'justify-end gap-3'} pt-4 border-t`}
          style={{
            paddingBottom: isKeyboardOpen && mobile ? '20px' : undefined
          }}
        >
          {onCancel && (
            <MobileButton 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isLoading}
              className={mobile ? 'w-full' : ''}
            >
              Cancel
            </MobileButton>
          )}
          <MobileButton 
            type="submit"
            disabled={!formState.name.trim() || isLoading}
            className={mobile ? 'w-full' : ''}
          >
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                Saving...
              </>
            ) : submitLabel}
          </MobileButton>
        </div>
      </form>
    </div>
  );
};

export default CollectionForm;