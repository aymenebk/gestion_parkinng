export interface Vehicle {
  macaron: string;
  matricule: string;
  modele: string;
  marque: string;
  couleur: string;
  bloc: string;
  telephone: string;
}

export type Lang = 'fr' | 'ar';

export interface SearchResult {
  found: boolean;
  vehicle?: Vehicle;
  query: string;
}
