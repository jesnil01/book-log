import type { Book } from '../types/book';
import { BookCard } from './BookCard';

interface BookScrollListProps {
  books: Book[];
  onEdit: (book: Book) => void;
  onDelete: (id: string) => void;
  title?: string;
}

export function BookScrollList({ books, onEdit, onDelete, title = 'Your Books' }: BookScrollListProps) {
  if (books.length === 0) {
    return null;
  }

  return (
    <div className="book-scroll-section">
      <h2 className="scroll-section-title">{title}</h2>
      <div className="book-scroll-container">
        <div className="book-scroll-list">
          {books.map(book => (
            <div key={book.id} className="book-scroll-item">
              <BookCard
                book={book}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
