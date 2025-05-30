// src/config/colors.ts
export const APP_COLORS = {
  // Core functional areas - simplified 4-color system
  discover: {
    primary: 'blue-600',
    light: 'blue-100', 
    dark: 'blue-700',
    gradient: 'from-blue-600 to-blue-700',
    text: 'text-blue-600',
    bg: 'bg-blue-600',
    hover: 'hover:bg-blue-700',
    border: 'border-blue-200',
    ring: 'ring-blue-500'
  },
  
  collections: {
    primary: 'purple-600',
    light: 'purple-100',
    dark: 'purple-700', 
    gradient: 'from-purple-600 to-purple-700',
    text: 'text-purple-600',
    bg: 'bg-purple-600',
    hover: 'hover:bg-purple-700',
    border: 'border-purple-200',
    ring: 'ring-purple-500'
  },
  
  routes: {
    primary: 'green-600',
    light: 'green-100',
    dark: 'green-700',
    gradient: 'from-green-600 to-green-700', 
    text: 'text-green-600',
    bg: 'bg-green-600',
    hover: 'hover:bg-green-700',
    border: 'border-green-200',
    ring: 'ring-green-500'
  },
  
  management: {
    primary: 'gray-700',
    light: 'gray-100',
    dark: 'gray-800',
    gradient: 'from-gray-700 to-gray-800',
    text: 'text-gray-700', 
    bg: 'bg-gray-700',
    hover: 'hover:bg-gray-800',
    border: 'border-gray-200',
    ring: 'ring-gray-500'
  },
  
  // Special elements
  favorites: {
    primary: 'amber-500',
    light: 'amber-100',
    dark: 'amber-600',
    text: 'text-amber-600',
    bg: 'bg-amber-500',
    hover: 'hover:bg-amber-600',
    border: 'border-amber-200',
    fill: 'fill-amber-500'
  },
  
  // Neutral elements
  neutral: {
    primary: 'gray-600',
    light: 'gray-50',
    text: 'text-gray-600',
    bg: 'bg-gray-600',
    hover: 'hover:bg-gray-100',
    border: 'border-gray-200'
  }
} as const;

// Page-to-color mapping
export const PAGE_COLORS = {
  home: APP_COLORS.discover,
  discover: APP_COLORS.discover,
  collections: APP_COLORS.collections,
  'collection-detail': APP_COLORS.collections,
  routes: APP_COLORS.routes,
  'route-detail': APP_COLORS.routes,
  visits: APP_COLORS.discover, // Visits are part of discovery journey
  library: APP_COLORS.management,
  profile: APP_COLORS.management,
  settings: APP_COLORS.management,
  about: APP_COLORS.management
} as const;

// Helper functions
export const getPageColors = (page: keyof typeof PAGE_COLORS) => {
  return PAGE_COLORS[page] || APP_COLORS.neutral;
};

export const getColorClasses = (area: keyof typeof APP_COLORS) => {
  return APP_COLORS[area];
};

// Component-specific color utilities
export const getBadgeColors = (variant: 'discover' | 'collections' | 'routes' | 'favorites' | 'neutral' = 'neutral') => {
  const colors = APP_COLORS[variant];
  return `${colors.light} ${colors.text} ${colors.border}`;
};

export const getButtonColors = (variant: 'discover' | 'collections' | 'routes' | 'management' = 'neutral') => {
  const colors = APP_COLORS[variant];
  return {
    primary: `${colors.bg} ${colors.hover} text-white`,
    outline: `border ${colors.border} ${colors.text} hover:${colors.light}`,
    ghost: `${colors.text} hover:${colors.light}`
  };
};

export const getHeaderGradient = (page: keyof typeof PAGE_COLORS) => {
  return `bg-gradient-to-br ${getPageColors(page).gradient}`;
};

// Stats color mapping for consistency
export const STATS_COLORS = {
  primary: APP_COLORS.discover.text,
  secondary: APP_COLORS.neutral.text,
  success: APP_COLORS.routes.text,
  warning: APP_COLORS.favorites.text,
  info: APP_COLORS.collections.text
} as const;