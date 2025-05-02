import React from 'react';
import { LucideIcon } from 'lucide-react';

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  color?: string;
  className?: string;
};

export const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  color = "blue",
  className = ''
}: FeatureCardProps) => {
  const bgColor = `bg-${color}-100`;
  const hoverBgColor = `group-hover:bg-${color}-200`;
  const iconBgColor = `bg-${color}-600`;
  
  return (
    <div className={`bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden group ${className}`}>
      <div className={`h-32 ${bgColor} flex items-center justify-center ${hoverBgColor} transition`}>
        <div className={`w-16 h-16 rounded-full ${iconBgColor} flex items-center justify-center text-white group-hover:scale-110 transition duration-300`}>
          <Icon size={28} />
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
};

export default FeatureCard;