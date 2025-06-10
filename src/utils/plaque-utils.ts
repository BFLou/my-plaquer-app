// src/utils/plaque-utils.ts
import { useEffect, useState } from 'react';
import { Plaque } from '@/types/plaque';

// Types to match the expected structure
export type PlaqueCounts = {
  authors: number;
  women: number;
  scientists: number;
  nineteenthCentury: number;
  westminster: number;
  bluePlaques: number;
  greenPlaques: number;
  popularLocations: { name: string; count: number }[];
  popularFigures: { name: string; profession: string }[];
};

export type PlaqueCategory = {
  label: string;
  icon: string;
  count: number;
  onClick: () => void;
};

// Type guard to verify Plaque array
function isPlaqueArray(data: unknown): data is Plaque[] {
  return Array.isArray(data) && 
    (data.length === 0 || 
     (typeof data[0] === 'object' && 
      data[0] !== null &&
      'id' in data[0] && 
      'title' in data[0]));
}

// Helper to safely extract array from various import structures
function extractPlaqueArray(imported: unknown): Plaque[] {
  // Direct array
  if (isPlaqueArray(imported)) {
    return imported;
  }
  
  // Default export
  if (typeof imported === 'object' && imported !== null && 'default' in imported) {
    const defaultExport = (imported as any).default;
    if (isPlaqueArray(defaultExport)) {
      return defaultExport;
    }
  }
  
  // Object with array values
  if (typeof imported === 'object' && imported !== null) {
    const values = Object.values(imported);
    for (const value of values) {
      if (isPlaqueArray(value)) {
        return value;
      }
    }
    
    // Flatten all arrays found in values
    const arrays = values.filter(Array.isArray);
    if (arrays.length > 0) {
      const flattened = arrays.flat();
      if (isPlaqueArray(flattened)) {
        return flattened;
      }
    }
  }
  
  // Fallback to empty array
  return [];
}

export const usePlaqueCounts = (): { counts: PlaqueCounts; loading: boolean } => {
  const [counts, setCounts] = useState<PlaqueCounts>({
    authors: 0,
    women: 0,
    scientists: 0,
    nineteenthCentury: 0,
    westminster: 0,
    bluePlaques: 0,
    greenPlaques: 0,
    popularLocations: [],
    popularFigures: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const plaqueDataModule = await import('@/data/plaque_data.json');
        const plaqueData = extractPlaqueArray(plaqueDataModule);
        setCounts(calculatePlaqueCounts(plaqueData));
      } catch (error) {
        console.error("Error fetching plaque counts:", error);
        setCounts(calculatePlaqueCounts([]));
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  return { counts, loading };
};

export const calculatePlaqueCounts = (inputData: unknown): PlaqueCounts => {
  // Ensure we have a valid plaque array
  const plaqueData = isPlaqueArray(inputData) ? inputData : [];

  if (plaqueData.length === 0) {
    console.warn('No plaque data available for calculations');
    return {
      authors: 0,
      women: 0,
      scientists: 0,
      nineteenthCentury: 0,
      westminster: 0,
      bluePlaques: 0,
      greenPlaques: 0,
      popularLocations: [],
      popularFigures: [],
    };
  }

  // Count authors/writers
  const authors = plaqueData.filter((p) => {
    const role = (p.lead_subject_primary_role || p.profession || '').toString().toLowerCase();
    return (
      role.includes('author') ||
      role.includes('writer') ||
      role.includes('novelist') ||
      role.includes('poet') ||
      role.includes('playwright')
    );
  }).length;

  // Count women based on roles and known names
  const women = plaqueData.filter((p) => {
    const name = (p.lead_subject_name || p.title || '').toString().toLowerCase();
    const role = (p.lead_subject_primary_role || p.profession || '').toString().toLowerCase();

    return (
      role.includes('actress') ||
      role.includes('queen') ||
      role.includes('duchess') ||
      role.includes('princess') ||
      role.includes('suffragette') ||
      name.includes('mrs ') ||
      name.includes('lady ') ||
      ['florence nightingale', 'jane austen', 'ada lovelace', 'queen victoria', 'marie curie', 'virginia woolf', 'elizabeth'].some((person) =>
        name.includes(person)
      )
    );
  }).length;

  // Count scientists
  const scientists = plaqueData.filter((p) => {
    const role = (p.lead_subject_primary_role || p.profession || '').toString().toLowerCase();
    return (
      role.includes('scientist') ||
      role.includes('physicist') ||
      role.includes('chemist') ||
      role.includes('biologist') ||
      role.includes('mathematician') ||
      role.includes('engineer') ||
      role.includes('astronomer') ||
      role.includes('botanist') ||
      role.includes('researcher') ||
      role.includes('inventor')
    );
  }).length;

  // Count 19th century plaques by birth/death year or era tag
  const nineteenthCentury = plaqueData.filter((p) => {
    const born = (p.lead_subject_born_in || p.erected || '').toString();
    const died = (p.lead_subject_died_in || '').toString();

    const bornYear = parseInt(born);
    const diedYear = parseInt(died);

    return (
      (!isNaN(bornYear) && bornYear >= 1800 && bornYear <= 1899) ||
      (!isNaN(diedYear) && diedYear >= 1800 && diedYear <= 1899)
    );
  }).length;

  // Count plaques in Westminster area or postcode
  const westminster = plaqueData.filter((p) => {
    const area = (p.area || '').toString().toLowerCase();
    const address = (p.address || p.location || '').toString().toLowerCase();
    const postcode = (p.postcode || '').toString().toLowerCase();

    return (
      area.includes('westminster') ||
      address.includes('westminster') ||
      postcode.startsWith('sw1')
    );
  }).length;

  // Count blue plaques by color field
  const bluePlaques = plaqueData.filter((p) => {
    const color = (p.color || p.colour || '').toString().toLowerCase();
    return color === 'blue';
  }).length;

  // Count green plaques by color field
  const greenPlaques = plaqueData.filter((p) => {
    const color = (p.color || p.colour || '').toString().toLowerCase();
    return color === 'green';
  }).length;

  // Calculate popular locations with counts
  const locationCounts: Record<string, number> = {};
  plaqueData.forEach((p) => {
    const area = (p.area || '').toString().trim();
    if (area && area.toLowerCase() !== 'unknown' && area.length > 0) {
      locationCounts[area] = (locationCounts[area] || 0) + 1;
    }
  });
  
  const popularLocations = Object.entries(locationCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate popular figures with multiple plaques
  const subjectCounts: Record<string, { count: number; profession: string }> = {};
  plaqueData.forEach((p) => {
    const name = (p.lead_subject_name || p.title || '').toString().trim();
    const profession = (p.lead_subject_primary_role || p.profession || '').toString().trim();

    if (name && name.toLowerCase() !== 'unknown' && name.length > 0) {
      if (!subjectCounts[name]) {
        subjectCounts[name] = { count: 0, profession: profession || 'Unknown' };
      }
      subjectCounts[name].count += 1;
    }
  });
  
  const popularFigures = Object.entries(subjectCounts)
    .filter(([_, info]) => info.count > 1) // Only include figures with multiple plaques
    .map(([name, info]) => ({
      name,
      profession: info.profession,
      count: info.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(({ name, profession }) => ({
      name,
      profession: profession.charAt(0).toUpperCase() + profession.slice(1),
    }));

  return {
    authors,
    women,
    scientists,
    nineteenthCentury,
    westminster,
    bluePlaques,
    greenPlaques,
    popularLocations,
    popularFigures,
  };
};

export const getPlaqueCategories = (
  counts: PlaqueCounts,
  navigate: (path: string) => void
): PlaqueCategory[] => {
  return [
    {
      label: 'Famous Authors',
      icon: '📚',
      count: counts.authors,
      onClick: () =>
        navigate(
          '/discover?professions=author,writer,novelist,poet,playwright&view=grid'
        ),
    },
    {
      label: 'Women Figures',
      icon: '👩',
      count: counts.women,
      onClick: () =>
        navigate(
          '/discover?search=mrs lady actress queen duchess princess suffragette&view=grid'
        ),
    },
    {
      label: 'Scientists',
      icon: '🧪',
      count: counts.scientists,
      onClick: () =>
        navigate(
          '/discover?professions=scientist,physicist,chemist,biologist,mathematician,engineer,astronomer,botanist,researcher,inventor&view=grid'
        ),
    },
    {
      label: '19th Century',
      icon: '🏛️',
      count: counts.nineteenthCentury,
      onClick: () =>
        navigate('/discover?search=1800 1850 1890 nineteenth century&view=grid'),
    },
    {
      label: 'Westminster',
      icon: '🏛️',
      count: counts.westminster,
      onClick: () =>
        navigate('/discover?search=westminster sw1&view=grid'),
    },
    {
      label: 'Blue Plaques',
      icon: '🔵',
      count: counts.bluePlaques,
      onClick: () => navigate('/discover?colors=blue&view=grid'),
    },
    {
      label: 'Green Plaques',
      icon: '🟢',
      count: counts.greenPlaques,
      onClick: () => navigate('/discover?colors=green&view=grid'),
    },
  ];
};

// Helper function to get plaque statistics summary
export const getPlaqueSummary = (counts: PlaqueCounts): string => {
  const total = counts.authors + counts.scientists + counts.bluePlaques + counts.greenPlaques;
  return `Explore ${total} historic plaques across London, featuring ${counts.authors} authors, ${counts.scientists} scientists, and landmarks from ${counts.popularLocations.length} popular areas.`;
};

// Helper function to get the most popular category
export const getMostPopularCategory = (counts: PlaqueCounts): { category: string; count: number } => {
  const categories = [
    { category: 'Authors', count: counts.authors },
    { category: 'Scientists', count: counts.scientists },
    { category: 'Blue Plaques', count: counts.bluePlaques },
    { category: 'Green Plaques', count: counts.greenPlaques },
    { category: 'Westminster', count: counts.westminster },
  ];
  
  return categories.reduce((max, current) => 
    current.count > max.count ? current : max
  );
};