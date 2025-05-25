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
        
        // Handle all possible import scenarios
        let plaqueData: Plaque[] = [];
        if (isPlaqueArray(plaqueDataModule)) {
          plaqueData = plaqueDataModule;
        } else if (isPlaqueArray(plaqueDataModule?.default)) {
          plaqueData = plaqueDataModule.default;
        } else if (typeof plaqueDataModule === 'object' && plaqueDataModule !== null) {
          // Last resort - try to convert object values to array
          plaqueData = Object.values(plaqueDataModule).filter(isPlaqueArray).flat();
        }

        setCounts(calculatePlaqueCounts(plaqueData));
      } catch (error) {
        console.error("Error fetching plaque counts:", error);
        setCounts(calculatePlaqueCounts([])); // Explicitly pass empty array
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  return { counts, loading };
};

export const calculatePlaqueCounts = (inputData: unknown): PlaqueCounts => {
  // Ensure we have an array
  const plaqueData = isPlaqueArray(inputData) ? inputData : [];

  // Count authors/writers
  const authors = plaqueData.filter((p) => {
    const role = (p.lead_subject_primary_role || '').toString().toLowerCase();
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
    const name = (p.lead_subject_name || '').toString().toLowerCase();
    const role = (p.lead_subject_primary_role || '').toString().toLowerCase();

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
    const role = (p.lead_subject_primary_role || '').toString().toLowerCase();
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
    const born = (p.lead_subject_born_in || '').toString();
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
    const address = (p.address || '').toString().toLowerCase();
    const location = (p.location || '').toString().toLowerCase();
    const postcode = (p.postcode || '').toString().toLowerCase();

    return (
      area.includes('westminster') ||
      address.includes('westminster') ||
      location.includes('westminster') ||
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
    const area = (p.area || '').toString();
    if (area && area.toLowerCase() !== 'unknown') {
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
    const name = (p.lead_subject_name || '').toString();
    const profession = (p.lead_subject_primary_role || '').toString();

    if (name && name.toLowerCase() !== 'unknown') {
      if (!subjectCounts[name]) {
        subjectCounts[name] = { count: 0, profession: profession || 'Unknown' };
      }
      subjectCounts[name].count += 1;
    }
  });
  const popularFigures = Object.entries(subjectCounts)
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
      label: 'Scientists',
      icon: '🧪',
      count: counts.scientists,
      onClick: () =>
        navigate(
          '/discover?professions=scientist,physicist,chemist,biologist,mathematician,engineer,astronomer,botanist,researcher,inventor&view=grid'
        ),
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