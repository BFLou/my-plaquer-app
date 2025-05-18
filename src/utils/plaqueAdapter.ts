// src/utils/plaqueAdapter.ts
type RawPlaqueData = {
  id: number;
  title?: string;
  area?: string;
  address?: string;
  postcode?: string;
  latitude?: string | number;
  longitude?: string | number;
  erected?: string;
  colour?: string;
  color?: string;
  inscription?: string;
  lead_subject_name?: string;
  lead_subject_primary_role?: string;
  lead_subject_born_in?: string;
  lead_subject_died_in?: string;
  lead_subject_wikipedia?: string;
  organisations?: string;
  subjects?: string;
  language?: string;
  series?: string;
  main_photo?: string;
  [key: string]: any;
};

/**
 * Converts raw plaque data to a consistent format for the application
 */
export function adaptPlaquesData(rawData: RawPlaqueData[], visitedIds: number[] = []): any[] {
  return rawData.map(plaque => {
    // Normalize and clean up properties
    const adaptedPlaque = {
      id: plaque.id || 0,
      title: plaque.title || 'Unknown Plaque',
      area: plaque.area || '',
      address: plaque.address || '',
      postcode: plaque.postcode || '',
      location: plaque.address ? `${plaque.address}, ${plaque.area || ''}`.trim() : plaque.area || '',
      latitude: plaque.latitude || null,
      longitude: plaque.longitude || null,
      erected: plaque.erected || '',
      color: plaque.colour || plaque.color || 'blue', // Normalize color field
      inscription: plaque.inscription || '',
      
      // Subject information
      lead_subject_name: plaque.lead_subject_name || '',
      profession: plaque.lead_subject_primary_role || '', // Use as profession
      lead_subject_primary_role: plaque.lead_subject_primary_role || '',
      lead_subject_born_in: plaque.lead_subject_born_in || '',
      lead_subject_died_in: plaque.lead_subject_died_in || '',
      lead_subject_wikipedia: plaque.lead_subject_wikipedia || '',
      
      // Additional info
      organisations: plaque.organisations || '[]',
      subjects: plaque.subjects || '[]',
      language: plaque.language || '',
      series: plaque.series || '',
      
      // Image
      image: plaque.main_photo || '',
      
      // Visit status - default to false or true if in visitedIds
      visited: visitedIds.includes(plaque.id) || false
    };
    
    // Clean up and transform specific fields
    
    // Parse coordinates to numbers if they're strings
    if (adaptedPlaque.latitude && typeof adaptedPlaque.latitude === 'string') {
      adaptedPlaque.latitude = parseFloat(adaptedPlaque.latitude);
    }
    
    if (adaptedPlaque.longitude && typeof adaptedPlaque.longitude === 'string') {
      adaptedPlaque.longitude = parseFloat(adaptedPlaque.longitude);
    }
    
    // Normalize color naming
    if (adaptedPlaque.color === 'grey') {
      adaptedPlaque.color = 'gray';
    }
    
    return adaptedPlaque;
  });
}

/**
 * Parses JSON fields safely
 */
export function safeParseJSON(jsonString: string, defaultValue = []) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return defaultValue;
  }
}

export default { 
  adaptPlaquesData,
  safeParseJSON
};