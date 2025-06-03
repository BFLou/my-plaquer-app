// src/components/settings/SettingsTabs.tsx
import React, { useRef, useEffect } from 'react';
import { User, Lock, BellRing, Shield, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";

interface SettingsTabsProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { value: 'profile', icon: User, label: 'Profile' },
  { value: 'security', icon: Lock, label: 'Security' },
  { value: 'notifications', icon: BellRing, label: 'Notifications' },
  { value: 'privacy', icon: Shield, label: 'Privacy' },
  { value: 'location', icon: MapPin, label: 'Location' },
];

const SettingsTabs: React.FC<SettingsTabsProps> = ({ currentTab, onTabChange }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = React.useState(false);
  const [showRightScroll, setShowRightScroll] = React.useState(false);

  // Check scroll position and update scroll indicators
  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftScroll(scrollLeft > 0);
    setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    checkScrollPosition();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      window.addEventListener('resize', checkScrollPosition);
      return () => {
        container.removeEventListener('scroll', checkScrollPosition);
        window.removeEventListener('resize', checkScrollPosition);
      };
    }
  }, []);

  // Scroll to active tab when it changes
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const activeTab = container.querySelector(`[data-value="${currentTab}"]`) as HTMLElement;
    if (activeTab) {
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      
      if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
        activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center' });
      }
    }
  }, [currentTab]);

  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="relative">
        {/* Left scroll button */}
        {showLeftScroll && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-0 top-0 bottom-0 z-10 h-full w-8 p-0 rounded-none bg-gradient-to-r from-white to-transparent"
            onClick={scrollLeft}
          >
            <ChevronLeft size={16} />
          </Button>
        )}

        {/* Tabs container */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide border-b scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.value;
            
            return (
              <button
                key={tab.value}
                data-value={tab.value}
                className={cn(
                  "flex-shrink-0 px-4 py-3 font-medium text-sm whitespace-nowrap transition-all flex items-center gap-2 min-w-[120px] justify-center min-h-[52px]",
                  isActive 
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" 
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                )}
                onClick={() => onTabChange(tab.value)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right scroll button */}
        {showRightScroll && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 bottom-0 z-10 h-full w-8 p-0 rounded-none bg-gradient-to-l from-white to-transparent"
            onClick={scrollRight}
          >
            <ChevronRight size={16} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default SettingsTabs;
