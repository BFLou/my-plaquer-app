// src/components/collections/AddPlaquesButton.tsx
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AddPlaquesButtonProps extends React.ComponentProps<typeof Button> {
  onAddPlaques: () => void;
  isLoading?: boolean;
}

const AddPlaquesButton: React.FC<AddPlaquesButtonProps> = ({
  onAddPlaques,
  isLoading = false,
  variant = 'default',
  size = 'default',
  className,
  ...props
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onAddPlaques}
      disabled={isLoading}
      className={className}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
          Adding...
        </>
      ) : (
        <>
          <Plus size={16} className="mr-2" />
          Add Plaques
        </>
      )}
    </Button>
  );
};

export default AddPlaquesButton;
