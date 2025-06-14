import { Grid, List, Map as MapIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

export type ViewMode = 'grid' | 'list' | 'map';

type ViewToggleProps = {
  viewMode: ViewMode;
  onChange: (value: ViewMode) => void;
  showMap?: boolean;
  variant?: 'tabs' | 'buttons';
  className?: string;
};

export const ViewToggle = ({
  viewMode,
  onChange,
  showMap = true,
  variant = 'tabs',
  className = '',
}: ViewToggleProps) => {
  if (variant === 'tabs') {
    return (
      <Tabs
        defaultValue={viewMode}
        onValueChange={(value) => onChange(value as ViewMode)}
        className={className}
      >
        <TabsList>
          <TabsTrigger value="grid">
            <Grid size={16} />
          </TabsTrigger>
          <TabsTrigger value="list">
            <List size={16} />
          </TabsTrigger>
          {showMap && (
            <TabsTrigger value="map">
              <MapIcon size={16} />
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>
    );
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        variant={viewMode === 'grid' ? 'default' : 'outline'}
        size="icon"
        onClick={() => onChange('grid')}
      >
        <Grid size={16} />
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'outline'}
        size="icon"
        onClick={() => onChange('list')}
      >
        <List size={16} />
      </Button>
      {showMap && (
        <Button
          variant={viewMode === 'map' ? 'default' : 'outline'}
          size="icon"
          onClick={() => onChange('map')}
        >
          <MapIcon size={16} />
        </Button>
      )}
    </div>
  );
};

export default ViewToggle;
