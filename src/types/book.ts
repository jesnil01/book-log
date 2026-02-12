export type Language = 'English' | 'Swedish';
export type Format = 'E-book' | 'Physical' | 'Audio';

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  pages: number;
  language: Language;
  format: Format;
  rating: number; // 1-10
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export type BookInput = Omit<Book, 'id' | 'createdAt' | 'updatedAt'>;
