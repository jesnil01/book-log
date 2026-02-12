import type { Book } from '../types/book';
import { BookCard } from './BookCard';

interface BookListProps {
  books: Book[];
  onEdit: (book: Book) => void;
  onDelete: (id: string) => void;
}

export function BookList({ books, onEdit, onDelete }: BookListProps) {
  if (books.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state-message">No books logged yet.</p>
        <p className="empty-state-hint">Click "Add Book" to start logging your reading!</p>
      </div>
    );
  }

  return (
    <div className="book-list">
      {books.map(book => (
        <BookCard
          key={book.id}
          book={book}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
