// src/utils/plaque-utils.ts
import { useEffect, useState } from 'react';

// Types to match the expected structure
export type PlaqueCounts = {
  authors: number;
  women: number;
  scientists: number;
  nineteenthCentury: number;
  westminster: number;
  bluePlaques: number;
  greenPlaques: number;
  popularLocations: {name: string, count: number}[];
  popularFigures: {name: string, profession: string}[];
}

export type PlaqueCategory = {
  label: string;
  icon: string;
  count: number;
  onClick: () => void;
}

/**
 * Custom hook to get plaque counts for categories
 */
export const usePlaqueCounts = (): { counts: PlaqueCounts, loading: boolean } => {
  const [counts, setCounts] = useState<PlaqueCounts>({
    authors: 0,
    women: 0,
    scientists: 0,
    nineteenthCentury: 0,
    westminster: 0,
    bluePlaques: 0,
    greenPlaques: 0,
    popularLocations: [],
    popularFigures: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Import data from plaque_data.json
        const plaqueDataModule = await import('@/data/plaque_data.json');
        const plaqueData = plaqueDataModule.default;
        
        // Calculate the actual counts from the real data
        const calculatedCounts = calculatePlaqueCounts(plaqueData);
        setCounts(calculatedCounts);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching plaque counts:", error);
        // If there's an error, we'll use fallback values
        setCounts({
          authors: 0,
          women: 0,
          scientists: 0, 
          nineteenthCentury: 0,
          westminster: 0,
          bluePlaques: 0,
          greenPlaques: 0,
          popularLocations: [],
          popularFigures: []
        });
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  return { counts, loading };
};

/**
 * Calculate plaque counts from the raw JSON data
 */
export const calculatePlaqueCounts = (plaqueData: any[]): PlaqueCounts => {
  // Count authors/writers
  const authors = plaqueData.filter(p => {
    const role = (p.lead_subject_primary_role || '').toString().toLowerCase();
    return role.includes('author') || 
           role.includes('writer') || 
           role.includes('novelist') || 
           role.includes('poet') ||
           role.includes('playwright');
  }).length;
  
  // Count women - in plaques data, we have to infer this from names and roles
  const women = plaqueData.filter(p => {
    const name = (p.lead_subject_name || '').toString().toLowerCase();
    const role = (p.lead_subject_primary_role || '').toString().toLowerCase();
    
    // We'll look for common female identifiers in names and roles
    return role.includes('actress') || 
           role.includes('queen') || 
           role.includes('duchess') ||
           role.includes('princess') ||
           role.includes('suffragette') ||
           name.includes('mrs ') || 
           name.includes('lady ') ||
           // Some known female historical figures that might be in the data
           ['florence nightingale', 'jane austen', 'ada lovelace', 'queen victoria',
            'marie curie', 'virginia woolf', 'elizabeth'].some(
              person => name.includes(person)
           );
  }).length;
  
  // Count scientists
  const scientists = plaqueData.filter(p => {
    const role = (p.lead_subject_primary_role || '').toString().toLowerCase();
    return role.includes('scientist') || 
           role.includes('physicist') || 
           role.includes('chemist') ||
           role.includes('biologist') ||
           role.includes('mathematician') ||
           role.includes('engineer') ||
           role.includes('astronomer') ||
           role.includes('botanist') ||
           role.includes('researcher') ||
           role.includes('inventor');
  }).length;
  
  // Count 19th century plaques based on birth/death dates
  const nineteenthCentury = plaqueData.filter(p => {
    // Try to get birth and death dates
    const born = (p.lead_subject_born_in || '').toString();
    const died = (p.lead_subject_died_in || '').toString();
    
    // Check if either birth or death year falls between 1800-1899
    const bornYear = parseInt(born);
    const diedYear = parseInt(died);
    
    return (
      // Born in 19th century
      (!isNaN(bornYear) && bornYear >= 1800 && bornYear <= 1899) ||
      // Died in 19th century
      (!isNaN(diedYear) && diedYear >= 1800 && diedYear <= 1899) ||
      // If explicit era information exists (not common but possible)
      (p.era && p.era.toString().toLowerCase().includes('19th century'))
    );
  }).length;
  
  // Count plaques in Westminster
  const westminster = plaqueData.filter(p => {
    const area = (p.area || '').toString().toLowerCase();
    const address = (p.address || '').toString().toLowerCase();
    const location = (p.location || '').toString().toLowerCase();
    const postcode = (p.postcode || '').toString().toLowerCase();
    
    return area.includes('westminster') || 
           address.includes('westminster') || 
           location.includes('westminster') ||
           // Westminster postcodes typically start with SW1
           postcode.startsWith('sw1');
  }).length;
  
  // Count blue plaques
  const bluePlaques = plaqueData.filter(p => {
    const color = (p.color || p.colour || '').toString().toLowerCase();
    return color === 'blue';
  }).length;
  
  // Count green plaques
  const greenPlaques = plaqueData.filter(p => {
    const color = (p.color || p.colour || '').toString().toLowerCase();
    return color === 'green';
  }).length;
  
  // Calculate popular locations
  const locationCounts: Record<string, number> = {};
  plaqueData.forEach(p => {
    const area = (p.area || '').toString();
    if (area && area !== 'Unknown' && area !== 'unknown') {
      locationCounts[area] = (locationCounts[area] || 0) + 1;
    }
  });
  
  const popularLocations = Object.entries(locationCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Calculate popular figures
  // Find people who have multiple plaques
  const subjectCounts: Record<string, {count: number, profession: string}> = {};
  
  plaqueData.forEach(p => {
    const name = (p.lead_subject_name || '').toString();
    const profession = (p.lead_subject_primary_role || '').toString();
    
    if (name && name !== 'Unknown' && name !== 'unknown') {
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
      count: info.count 
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(({ name, profession }) => ({ 
      name, 
      profession: profession.charAt(0).toUpperCase() + profession.slice(1) 
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
    popularFigures
  };
};

/**
 * Get predefined categories with their corresponding counts
 * The filter parameters used in the onClick handlers should match 
 * exactly what the calculatePlaqueCounts function is filtering
 * 
 * @param counts The counts object from usePlaqueCounts
 * @param navigate The navigation function from useNavigate
 * @returns Array of category objects with labels, counts, and click handlers
 */
export const getPlaqueCategories = (counts: PlaqueCounts, navigate: (path: string) => void): PlaqueCategory[] => {
  return [
    { 
      label: "Famous Authors", 
      icon: "📚",
      count: counts.authors,
      onClick: () => navigate("/discover?professions=author,writer,novelist,poet,playwright&view=grid") 
    },
    { 
      label: "Scientists", 
      icon: "🧪",
      count: counts.scientists,
      onClick: () => navigate("/discover?professions=scientist,physicist,chemist,biologist,mathematician,engineer,astronomer,botanist,researcher,inventor&view=grid") 
    },
    {
      label: "Blue Plaques",
      icon: "🔵",
      count: counts.bluePlaques,
      onClick: () => navigate("/discover?colors=blue&view=grid")
    },
    {
      label: "Green Plaques",
      icon: "🟢",
      count: counts.greenPlaques,
      onClick: () => navigate("/discover?colors=green&view=grid")
    },
  ];
};