export type Language = 'English' | 'Swedish';
export type Format = 'E-book' | 'Physical' | 'Audio';

// Predefined vibes
export const PREDEFINED_VIBES = [
  'Bloody Mystery',
  'Cozy Mystery',
  'Thriller',
  'Romance',
  'Sci-Fi',
  'Fantasy',
  'Historical Fiction',
  'Dystopia',
  'Comedy',
  'Drama',
  'Mystery',
  'Horror',
  'Biography',
  'Self-Help',
  'Philosophy',
] as const;

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  pages: number;
  language: Language;
  format: Format;
  vibes: string[]; // Array of vibes, can include predefined or custom ones
  rating: number; // 1-10
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export type BookInput = Omit<Book, 'id' | 'createdAt' | 'updatedAt'>;
