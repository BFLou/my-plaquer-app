import React, { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Plus, Sparkles } from 'lucide-react';
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
import { PlaqueCard } from '@/components';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox";
import { Plaque } from '@/types/plaque';

export type NewCollection = {
  name: string;
  description: string;
  icon: string;
  color: string;
  isPublic?: boolean;
};

type CollectionCreationWizardProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (collection: NewCollection) => void;
  initialValues?: Partial<NewCollection>;
  availablePlaques?: Plaque[];
  title?: string;
  submitLabel?: string;
  isEdit?: boolean;
};

export const CollectionCreationWizard = ({
  isOpen,
  onClose,
  onSave,
  initialValues,
  availablePlaques = [],
  title = "Create New Collection",
  submitLabel = "Create Collection",
  isEdit = false
}: CollectionCreationWizardProps) => {
  // Form values
  const [name, setName] = useState(initialValues?.name || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [selectedIcon, setSelectedIcon] = useState(initialValues?.icon || '🎭');
  const [selectedColor, setSelectedColor] = useState(initialValues?.color || 'bg-blue-500');
  const [isPublic, setIsPublic] = useState(initialValues?.isPublic || false);
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlaques, setSelectedPlaques] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Icon and color options
  const icons = ['🎭', '🎶', '📚', '🏛️', '🏙️', '🌟', '🧠', '🏆', '🧪', '🎨', '🌍', '🎓', '🏺', '⚔️', '🎬', '🚀'];
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
  
  // Handle form submission
  const handleSubmit = () => {
    if (!name.trim()) return;
    
    onSave({
      name,
      description,
      icon: selectedIcon,
      color: selectedColor,
      isPublic
    });
    
    // Reset form and wizard
    if (!isEdit) {
      setName('');
      setDescription('');
      setSelectedIcon('🎭');
      setSelectedColor('bg-blue-500');
      setIsPublic(false);
      setSelectedPlaques([]);
      setCurrentStep(1);
    }
  };

  const handleSheetChange = (open: boolean) => {
    if (!open) {
      onClose();
      // Reset to first step when closing
      setCurrentStep(1);
    }
  };
  
  // Filter plaques based on search query
  const filteredPlaques = availablePlaques.filter(plaque => 
    plaque.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (plaque.location && plaque.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Handle going to next step
  const goToNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };
  
  // Handle going to previous step
  const goToPrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  // Check if current step is complete
  const isStepComplete = () => {
    if (currentStep === 1) {
      return name.trim().length > 0;
    }
    if (currentStep === 2) {
      return selectedIcon && selectedColor;
    }
    return true; // Step 3 is optional
  };
  
  // Toggle plaque selection
  const togglePlaqueSelection = (id: number) => {
    setSelectedPlaques(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={handleSheetChange}>
      <SheetContent side="right" className="sm:max-w-lg w-full">
        <SheetHeader className="border-b pb-4">
          <SheetTitle>{title}</SheetTitle>
          <div className="flex items-center justify-between mt-2">
            {/* Step indicators */}
            <div className="flex items-center gap-1">
              <div 
                className={`h-2.5 w-2.5 rounded-full ${
                  currentStep === 1 ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              ></div>
              <div 
                className={`h-2.5 w-2.5 rounded-full ${
                  currentStep === 2 ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              ></div>
              <div 
                className={`h-2.5 w-2.5 rounded-full ${
                  currentStep === 3 ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              ></div>
            </div>
            <div className="text-sm font-medium text-gray-500">
              Step {currentStep} of 3
            </div>
          </div>
        </SheetHeader>
        
        <div className="py-6 overflow-y-auto max-h-[calc(100vh-180px)]">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-1">
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
              
              <div className="space-y-1">
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
              
              <div className="flex items-center justify-between">
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
            </div>
          )}
          
          {/* Step 2: Visuals (Icon & Color) */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base">Choose an Icon</Label>
                <div className="grid grid-cols-8 gap-2">
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
              
              <div className="space-y-3">
                <Label className="text-base">Choose a Color</Label>
                <div className="grid grid-cols-6 gap-2">
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
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full ${selectedColor} flex items-center justify-center text-white text-2xl`}>
                    {selectedIcon}
                  </div>
                  <div>
                    <h3 className="font-medium">{name || "Collection Name"}</h3>
                    <p className="text-sm text-gray-500">{description || "Collection description will appear here"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Add Plaques (Optional) */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-medium">Add Plaques (Optional)</h3>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    {selectedPlaques.length} selected
                  </Badge>
                </div>
                
                <div className="mb-4">
                  <Input
                    type="search"
                    placeholder="Search plaques..."
                    className="w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {availablePlaques.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No plaques available to add.</p>
                    <p className="text-sm text-gray-400 mt-1">Explore and discover plaques first!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {filteredPlaques.map(plaque => (
                      <div 
                        key={plaque.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50"
                        onClick={() => togglePlaqueSelection(plaque.id)}
                      >
                        <Checkbox 
                          checked={selectedPlaques.includes(plaque.id)} 
                          onCheckedChange={() => togglePlaqueSelection(plaque.id)}
                          className="h-5 w-5"
                        />
                        <div className="shrink-0 w-12 h-12 rounded-md overflow-hidden bg-gray-100">
                          <img 
                            src={plaque.image || '/api/placeholder/50/50'} 
                            alt="" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="font-medium truncate">{plaque.title}</h4>
                          <p className="text-xs text-gray-500 truncate">{plaque.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <SheetFooter className="border-t pt-4">
          <div className="flex justify-between w-full">
            {currentStep > 1 ? (
              <Button 
                variant="outline" 
                onClick={goToPrevStep}
                className="flex items-center gap-1"
              >
                <ChevronLeft size={16} />
                Back
              </Button>
            ) : (
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            
            {currentStep < 3 ? (
              <Button 
                onClick={goToNextStep} 
                disabled={!isStepComplete()}
                className="flex items-center gap-1"
              >
                Next
                <ChevronRight size={16} />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={!isStepComplete()}
                className="flex items-center gap-1"
              >
                <Check size={16} />
                {submitLabel}
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default CollectionCreationWizard;