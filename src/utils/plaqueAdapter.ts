// src/utils/plaqueAdapter.ts
import { Plaque } from '@/types/plaque';

export function adaptPlaqueData(plaque: any): Plaque {
  return {
    id: plaque.id,
    title: plaque.title || `Plaque #${plaque.id}`,
    inscription: plaque.inscription || '',
    
    // Location data
    address: plaque.address || '',
    location: plaque.address || '', // For compatibility with existing components
    postcode: plaque.postcode || '',
    area: plaque.area || '',
    country: plaque.country || '',
    latitude: plaque.latitude,
    longitude: plaque.longitude,

    // Visual information
    main_photo: plaque.main_photo !== "Unknown" ? plaque.main_photo : null,
    image: plaque.main_photo !== "Unknown" ? plaque.main_photo : "/api/placeholder/400/300", // Fallback for UI
    colour: plaque.colour || "unknown",
    color: plaque.colour || "unknown", // For compatibility with existing components
    
    // Subject info
    profession: plaque.lead_subject_primary_role || "Unknown",
    description: plaque.inscription || '',
    
    // Metadata
    erected: plaque.erected || "Unknown",
    organisations: plaque.organisations || "[]",
    
    // Subject details
    lead_subject_name: plaque.lead_subject_name || "Unknown",
    lead_subject_primary_role: plaque.lead_subject_primary_role || "Unknown",
    lead_subject_born_in: plaque.lead_subject_born_in || "Unknown",
    lead_subject_died_in: plaque.lead_subject_died_in || "Unknown",
    
    // App-specific properties (defaults)
    visited: false,
    added: new Date().toLocaleDateString()
  };
}

export function adaptPlaquesData(plaques: any[]): Plaque[] {
  return plaques.map(adaptPlaqueData);
}