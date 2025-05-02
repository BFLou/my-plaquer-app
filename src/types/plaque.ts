// src/types/plaque.ts

export type Plaque = {
    id: number;
    machine_tag?: string;
    title: string;
    inscription: string;
    latitude?: number;
    longitude?: number;
    country?: string;
    area?: string;
    address: string;
    erected?: string | number;
    main_photo?: string;
    colour?: string;
    organisations?: string;
    language?: string;
    series?: string;
    series_ref?: string;
    postcode?: string;
    
    // For UI display and compatibility
    location?: string;
    color?: string;
    profession?: string;
    description?: string;
    visited?: boolean;
    image?: string;
    added?: string;
    
    // Subject information
    lead_subject_id?: number;
    lead_subject_machine_tag?: string;
    lead_subject_name?: string;
    lead_subject_surname?: string;
    lead_subject_sex?: string;
    lead_subject_born_in?: number | string;
    lead_subject_died_in?: number | string;
    lead_subject_type?: string;
    lead_subject_roles?: string;
    lead_subject_primary_role?: string;
    lead_subject_wikipedia?: string;
    lead_subject_dbpedia?: string;
    lead_subject_image?: string;
    
    // Other fields
    subjects?: string;
    geolocated?: boolean;
    photographed?: boolean;
    number_of_subjects?: number;
    number_of_male_subjects?: number;
    number_of_female_subjects?: number;
    number_of_inanimate_subjects?: number;
  };
  
  export type ViewMode = 'grid' | 'list' | 'map';