// src/components/settings/SettingsHeader.tsx
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface SettingsHeaderProps {
  user: any;
  onBack: () => void;
}

const SettingsHeader: React.FC<SettingsHeaderProps> = ({ onBack }) => {
  return (
    <section className="relative bg-gradient-to-br from-blue-600 to-blue-700 text-white py-8 px-4 overflow-hidden">
      {/* Decorative background circles */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white"></div>
        <div className="absolute bottom-10 right-20 w-60 h-60 rounded-full bg-white"></div>
        <div className="absolute top-40 right-40 w-20 h-20 rounded-full bg-white"></div>
      </div>
      
      <div className="container mx-auto max-w-5xl relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack} 
            className="h-8 w-8 p-0 bg-white/20 text-white hover:bg-white/30"
          >
            <ArrowLeft size={16} />
          </Button>
          <span className="text-white/80 text-sm">Back to Profile</span>
        </div>
        
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        <p className="opacity-90 mt-1">
          Manage your account, privacy, and app preferences
        </p>
      </div>
    </section>
  );
};

export default SettingsHeader;