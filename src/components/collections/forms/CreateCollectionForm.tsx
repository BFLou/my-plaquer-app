// src/components/collections/CreateCollectionForm.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Check, X, Info } from 'lucide-react';

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
  tags?: string[];
  isPublic?: boolean;
};

const CreateCollectionForm = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  initialPlaques = []
}) => {
  // Form state
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    icon: '📚',
    color: 'bg-blue-500',
    tags: [],
    isPublic: false
  });
  
  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [tagInput, setTagInput] = useState('');
  
  // Update form state
  const handleChange = (field, value) => {
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
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (formState.name.trim() === '') {
      setErrors({ name: 'Collection name is required' });
      setTouched({ name: true });
      return;
    }
    
    onSubmit(formState);
  };
  
  // Extract color name for gradient
  const colorName = formState.color.replace('bg-', '').split('-')[0];
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Collection</DialogTitle>
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
              </div>
              
              <div className="space-y-2">
                <Label