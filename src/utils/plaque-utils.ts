// src/utils/plaque-utils.ts
import { useEffect, useState } from 'react';
import { Plaque } from '@/types/plaque';

// Updated types to match your category structure
export type PlaqueCounts = {
  famousAuthors: number;
  artists: number;
  musicians: number;
  scientistsAndInventors: number;
  politiciansAndLeaders: number;
  architects: number;
  medicalProfessionals: number;
  // Keep some existing categories for backward compatibility
  women: number;
  // Removed nineteenthCentury
  // Removed westminster
  bluePlaques: number;
  greenPlaques: number;
  // New categories based on your data
  englishHeritage: number;
  londonCountyCouncil: number;
  greaterLondonCouncil: number;
  corporationOfLondon: number;
  // Removed Subject types counts
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
  return (
    Array.isArray(data) &&
    (data.length === 0 ||
      (typeof data[0] === 'object' &&
        data[0] !== null &&
        'id' in data[0] &&
        'title' in data[0]))
  );
}

// Helper to safely extract array from various import structures
function extractPlaqueArray(imported: unknown): Plaque[] {
  // Direct array
  if (isPlaqueArray(imported)) {
    return imported;
  }

  // Default export
  if (
    typeof imported === 'object' &&
    imported !== null &&
    'default' in imported
  ) {
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

export const usePlaqueCounts = (): {
  counts: PlaqueCounts;
  loading: boolean;
} => {
  const [counts, setCounts] = useState<PlaqueCounts>({
    famousAuthors: 0,
    artists: 0,
    musicians: 0,
    scientistsAndInventors: 0,
    politiciansAndLeaders: 0,
    architects: 0,
    medicalProfessionals: 0,
    women: 0,
    // Removed nineteenthCentury
    // Removed westminster
    bluePlaques: 0,
    greenPlaques: 0,
    englishHeritage: 0,
    londonCountyCouncil: 0,
    greaterLondonCouncil: 0,
    corporationOfLondon: 0,
    // Removed Subject types counts
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
        console.error('Error fetching plaque counts:', error);
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
      famousAuthors: 0,
      artists: 0,
      musicians: 0,
      scientistsAndInventors: 0,
      politiciansAndLeaders: 0,
      architects: 0,
      medicalProfessionals: 0,
      women: 0,
      // Removed nineteenthCentury
      // Removed westminster
      bluePlaques: 0,
      greenPlaques: 0,
      englishHeritage: 0,
      londonCountyCouncil: 0,
      greaterLondonCouncil: 0,
      corporationOfLondon: 0,
      // Removed Subject types counts
      popularLocations: [],
      popularFigures: [],
    };
  }

  // Helper function to check if profession matches category using categoryMappings
  const matchesProfessionCategory = (
    profession: string,
    category: string
  ): boolean => {
    const profLower = profession.toLowerCase();
    const categoryMappings = [
      {
        category: 'Famous Authors',
        keywords: [
          'poet',
          'novelist',
          'writer',
          'author',
          'playwright',
          'songwriter',
        ],
      },
      {
        category: 'Artists',
        keywords: [
          'artist',
          'painter',
          'sculptor',
          'artiste',
          'portrait painter',
          'landscape painter',
        ],
      },
      {
        category: 'Musicians',
        keywords: ['composer', 'musician', 'singer', 'conductor', 'jazz'],
      },
      {
        category: 'Scientists & Inventors',
        keywords: [
          'civil engineer',
          'engineer',
          'scientist',
          'inventor',
          'astronomer',
          'naturalist',
          'physicist',
          'chemist',
          'biologist',
          'mathematician',
          'botanist',
          'researcher',
        ],
      },
      {
        category: 'Politicians & Leaders',
        keywords: [
          'statesman',
          'politician',
          'prime minister',
          'campaigner',
          'activist',
          'mayor',
          'anti-slavery',
        ],
      },
      {
        category: 'Architects',
        keywords: ['architect', 'architectural'],
      },
      {
        category: 'Medical Professionals',
        keywords: [
          'doctor',
          'physician',
          'surgeon',
          'nurse',
          'medical',
          'medicine',
        ],
      },
    ];

    const mapping = categoryMappings.find((m) => m.category === category);
    return mapping
      ? mapping.keywords.some((keyword) => profLower.includes(keyword))
      : false;
  };

  // Helper function to check if organisation matches category using categoryMappings
  const matchesOrganisationCategory = (
    organisations: string,
    category: string
  ): boolean => {
    const orgsLower = organisations.toLowerCase();
    const organisationMappings = [
      {
        category: 'English Heritage',
        keywords: ['english heritage'],
      },
      {
        category: 'London County Council',
        keywords: ['london county council'],
      },
      {
        category: 'Greater London Council',
        keywords: ['greater london council'],
      },
      {
        category: 'Corporation of London',
        keywords: ['corporation of london'],
      },
    ];

    const mapping = organisationMappings.find((m) => m.category === category);
    return mapping
      ? mapping.keywords.some((keyword) => orgsLower.includes(keyword))
      : false;
  };

  // Count Famous Authors using categoryMappings
  const famousAuthors = plaqueData.filter((p) => {
    const profession = (
      p.lead_subject_primary_role ||
      p.profession ||
      ''
    ).toString();
    return matchesProfessionCategory(profession, 'Famous Authors');
  }).length;

  // Count Artists using categoryMappings
  const artists = plaqueData.filter((p) => {
    const profession = (
      p.lead_subject_primary_role ||
      p.profession ||
      ''
    ).toString();
    return matchesProfessionCategory(profession, 'Artists');
  }).length;

  // Count Musicians using categoryMappings
  const musicians = plaqueData.filter((p) => {
    const profession = (
      p.lead_subject_primary_role ||
      p.profession ||
      ''
    ).toString();
    return matchesProfessionCategory(profession, 'Musicians');
  }).length;

  // Count Scientists & Inventors using categoryMappings
  const scientistsAndInventors = plaqueData.filter((p) => {
    const profession = (
      p.lead_subject_primary_role ||
      p.profession ||
      ''
    ).toString();
    return matchesProfessionCategory(profession, 'Scientists & Inventors');
  }).length;

  // Count Politicians & Leaders using categoryMappings
  const politiciansAndLeaders = plaqueData.filter((p) => {
    const profession = (
      p.lead_subject_primary_role ||
      p.profession ||
      ''
    ).toString();
    return matchesProfessionCategory(profession, 'Politicians & Leaders');
  }).length;

  // Count Architects using categoryMappings
  const architects = plaqueData.filter((p) => {
    const profession = (
      p.lead_subject_primary_role ||
      p.profession ||
      ''
    ).toString();
    return matchesProfessionCategory(profession, 'Architects');
  }).length;

  // Count Medical Professionals using categoryMappings
  const medicalProfessionals = plaqueData.filter((p) => {
    const profession = (
      p.lead_subject_primary_role ||
      p.profession ||
      ''
    ).toString();
    return matchesProfessionCategory(profession, 'Medical Professionals');
  }).length;

  // Keep existing calculations for backward compatibility

  // Count women based on roles and known names
  const women = plaqueData.filter((p) => {
    const name = (p.lead_subject_name || p.title || '')
      .toString()
      .toLowerCase();
    const role = (p.lead_subject_primary_role || p.profession || '')
      .toString()
      .toLowerCase();

    return (
      role.includes('actress') ||
      role.includes('queen') ||
      role.includes('duchess') ||
      role.includes('princess') ||
      role.includes('suffragette') ||
      name.includes('mrs ') ||
      name.includes('lady ') ||
      [
        'florence nightingale',
        'jane austen',
        'ada lovelace',
        'queen victoria',
        'marie curie',
        'virginia woolf',
        'elizabeth',
      ].some((person) => name.includes(person))
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

  // Count plaques by organisation using categoryMappings
  const englishHeritage = plaqueData.filter((p) => {
    const orgs = (p.organisations || '').toString();
    return matchesOrganisationCategory(orgs, 'English Heritage');
  }).length;

  const londonCountyCouncil = plaqueData.filter((p) => {
    const orgs = (p.organisations || '').toString();
    return matchesOrganisationCategory(orgs, 'London County Council');
  }).length;

  const greaterLondonCouncil = plaqueData.filter((p) => {
    const orgs = (p.organisations || '').toString();
    return matchesOrganisationCategory(orgs, 'Greater London Council');
  }).length;

  const corporationOfLondon = plaqueData.filter((p) => {
    const orgs = (p.organisations || '').toString();
    return matchesOrganisationCategory(orgs, 'Corporation of London');
  }).length;

  // Removed Subject Type counts

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
  const subjectCounts: Record<string, { count: number; profession: string }> =
    {};
  plaqueData.forEach((p) => {
    const name = (p.lead_subject_name || p.title || '').toString().trim();
    const profession = (p.lead_subject_primary_role || p.profession || '')
      .toString()
      .trim();

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
    famousAuthors,
    artists,
    musicians,
    scientistsAndInventors,
    politiciansAndLeaders,
    architects,
    medicalProfessionals,
    women,
    bluePlaques,
    greenPlaques,
    englishHeritage,
    londonCountyCouncil,
    greaterLondonCouncil,
    corporationOfLondon,
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
      count: counts.famousAuthors,
      onClick: () =>
        navigate(
          '/discover?professions=poet,novelist,writer,author,playwright,songwriter&view=grid'
        ),
    },
    {
      label: 'Artists',
      icon: '🎨',
      count: counts.artists,
      onClick: () =>
        navigate(
          '/discover?professions=artist,painter,sculptor,music%20hall%20artiste,portrait%20painter,landscape%20painter&view=grid'
        ),
    },
    {
      label: 'Musicians',
      icon: '🎵',
      count: counts.musicians,
      onClick: () =>
        navigate(
          '/discover?professions=composer,musician,singer,conductor,jazz%20musician&view=grid'
        ),
    },
    {
      label: 'Scientists & Inventors',
      icon: '🔬',
      count: counts.scientistsAndInventors,
      onClick: () =>
        navigate(
          '/discover?professions=civil%20engineer,scientist,engineer,inventor,astronomer,naturalist,physicist,chemist,biologist,mathematician&view=grid'
        ),
    },
    {
      label: 'Politicians & Leaders',
      icon: '🏛️',
      count: counts.politiciansAndLeaders,
      onClick: () =>
        navigate(
          "/discover?professions=statesman,politician,Prime%20Minister%20of%20the%20United%20Kingdom,anti-slavery%20campaigner,campaigner%20for%20women's%20rights,Mayor%20of%20London,campaigner,activist&view=grid"
        ),
    },
    {
      label: 'Architects',
      icon: '🏗️',
      count: counts.architects,
      onClick: () =>
        navigate(
          '/discover?professions=architect,theatre%20architect,Fellow%20of%20the%20Royal%20Institute%20of%20British%20Architects,landscape%20architect,Gothic%20architect&view=grid'
        ),
    },
    {
      label: 'Medical Professionals',
      icon: '⚕️',
      count: counts.medicalProfessionals,
      onClick: () =>
        navigate(
          '/discover?professions=Doctor%20-%20Bachelor%20of%20Medicine%20MBBS,physician,surgeon,Doctor%20(unknown%20type),Doctor%20of%20Medicine,nurse&view=grid'
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
    // Removed Westminster category
    // Removed Women Figures category
    // Removed 19th Century category
  ];
};

// Helper function to get plaque statistics summary
export const getPlaqueSummary = (counts: PlaqueCounts): string => {
  const total =
    counts.famousAuthors +
    counts.artists +
    counts.musicians +
    counts.scientistsAndInventors +
    counts.politiciansAndLeaders +
    counts.architects +
    counts.medicalProfessionals;
  return `Explore ${total}+ historic plaques across London, featuring ${counts.famousAuthors} famous authors, ${counts.scientistsAndInventors} scientists & inventors, and landmarks from ${counts.popularLocations.length} popular areas.`;
};

// Helper function to get the most popular category
export const getMostPopularCategory = (
  counts: PlaqueCounts
): { category: string; count: number } => {
  const categories = [
    { category: 'Famous Authors', count: counts.famousAuthors },
    { category: 'Artists', count: counts.artists },
    { category: 'Musicians', count: counts.musicians },
    {
      category: 'Scientists & Inventors',
      count: counts.scientistsAndInventors,
    },
    { category: 'Politicians & Leaders', count: counts.politiciansAndLeaders },
    { category: 'Architects', count: counts.architects },
    { category: 'Medical Professionals', count: counts.medicalProfessionals },
  ];

  return categories.reduce((max, current) =>
    current.count > max.count ? current : max
  );
};

// Helper function to get category-specific filter suggestions
export const getCategoryFilterSuggestions = (category: string): string[] => {
  const categoryFilters: Record<string, string[]> = {
    'Famous Authors': [
      'poet',
      'novelist',
      'writer',
      'author',
      'playwright',
      'songwriter',
    ],
    Artists: [
      'artist',
      'painter',
      'sculptor',
      'music hall artiste',
      'portrait painter',
      'landscape painter',
    ],
    Musicians: ['composer', 'musician', 'singer', 'conductor', 'jazz musician'],
    'Scientists & Inventors': [
      'civil engineer',
      'scientist',
      'engineer',
      'inventor',
      'astronomer',
      'naturalist',
      'physicist',
      'chemist',
      'biologist',
      'mathematician',
    ],
    'Politicians & Leaders': [
      'statesman',
      'politician',
      'prime minister',
      'anti-slavery campaigner',
      'campaigner',
      'activist',
    ],
    Architects: [
      'architect',
      'theatre architect',
      'landscape architect',
      'gothic architect',
    ],
    'Medical Professionals': ['doctor', 'physician', 'surgeon', 'nurse'],
    'English Heritage': ['english heritage'],
    'London County Council': ['london county council'],
    'Greater London Council': ['greater london council'],
    'Corporation of London': ['corporation of london'],
  };

  return categoryFilters[category] || [];
};

// Helper function to determine category from profession
export const getCategoryFromProfession = (
  profession: string
): string | null => {
  const professionLower = profession.toLowerCase();

  const categoryMappings = [
    {
      category: 'Famous Authors',
      keywords: [
        'poet',
        'novelist',
        'writer',
        'author',
        'playwright',
        'songwriter',
      ],
    },
    {
      category: 'Artists',
      keywords: ['artist', 'painter', 'sculptor', 'artiste'],
    },
    {
      category: 'Musicians',
      keywords: ['composer', 'musician', 'singer', 'conductor', 'jazz'],
    },
    {
      category: 'Scientists & Inventors',
      keywords: [
        'engineer',
        'scientist',
        'inventor',
        'astronomer',
        'naturalist',
        'physicist',
        'chemist',
        'biologist',
        'mathematician',
      ],
    },
    {
      category: 'Politicians & Leaders',
      keywords: [
        'statesman',
        'politician',
        'prime minister',
        'campaigner',
        'activist',
        'mayor',
      ],
    },
    {
      category: 'Architects',
      keywords: ['architect'],
    },
    {
      category: 'Medical Professionals',
      keywords: ['doctor', 'physician', 'surgeon', 'nurse', 'medical'],
    },
  ];

  for (const mapping of categoryMappings) {
    if (mapping.keywords.some((keyword) => professionLower.includes(keyword))) {
      return mapping.category;
    }
  }

  return null;
};

// Helper function to determine category from organisation
export const getCategoryFromOrganisation = (
  organisations: string
): string | null => {
  const orgsLower = organisations.toLowerCase();

  const organisationMappings = [
    {
      category: 'English Heritage',
      keywords: ['english heritage'],
    },
    {
      category: 'London County Council',
      keywords: ['london county council'],
    },
    {
      category: 'Greater London Council',
      keywords: ['greater london council'],
    },
    {
      category: 'Corporation of London',
      keywords: ['corporation of london'],
    },
  ];

  for (const mapping of organisationMappings) {
    if (mapping.keywords.some((keyword) => orgsLower.includes(keyword))) {
      return mapping.category;
    }
  }

  return null;
};
