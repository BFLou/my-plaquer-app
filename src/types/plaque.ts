// src/types/plaque.ts
export type Plaque = {
  id: number;
  title: string;
  location?: string;
  address?: string;
  postcode?: string;
  color?: string;
  colour?: string; // Alternative spelling
  profession?: string;
  description?: string;
  inscription?: string;
  visited?: boolean;
  image?: string;
  main_photo?: string; // Alternative field name
  added?: string;
  erected?: string;
  organisations?: string;
  subjects?: string;
  lead_subject_name?: string;
  lead_subject_born_in?: string;
  lead_subject_died_in?: string;
  lead_subject_primary_role?: string;
  lead_subject_wikipedia?: string;
  latitude?: number;
  longitude?: number;
  area?: string;
  series?: string;
  language?: string;
  isFavorite?: boolean;
};

export type ViewMode = 'grid' | 'list' | 'map';

export type Collection = {
  id: number;
  name: string;
  description?: string;
  icon: string;
  color: string;
  plaques: number;
  updated: string;
  isPublic?: boolean;
  isFavorite?: boolean;
};

export type NewCollection = {
  name: string;
  description: string;
  icon: string;
  color: string;
  isPublic?: boolean;
};