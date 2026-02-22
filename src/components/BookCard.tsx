import type { Book } from '../types/book';

interface BookCardProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (id: string) => void;
}

export function BookCard({ book, onEdit, onDelete }: BookCardProps) {
  const formatBadgeClass = `format-badge format-${book.format.toLowerCase().replace('-', '')}`;
  
  // Ensure vibes is always an array
  const vibes = Array.isArray(book.vibes) ? book.vibes : [];
  
  const getRatingColor = (rating: number): string => {
    if (rating >= 8) return 'rating-high';
    if (rating >= 6) return 'rating-medium';
    return 'rating-low';
  };

  const getVibeColorClass = (vibe: string): string => {
    const vibeMap: Record<string, string> = {
      'Bloody Mystery': 'vibe-bloody',
      'Cozy Mystery': 'vibe-cozy',
      'Thriller': 'vibe-thriller',
      'Romance': 'vibe-romance',
      'Sci-Fi': 'vibe-scifi',
      'Fantasy': 'vibe-fantasy',
      'Historical Fiction': 'vibe-historical',
      'Dystopia': 'vibe-dystopia',
      'Comedy': 'vibe-comedy',
      'Drama': 'vibe-drama',
      'Mystery': 'vibe-mystery',
      'Horror': 'vibe-horror',
      'Biography': 'vibe-biography',
      'Self-Help': 'vibe-selfhelp',
      'Philosophy': 'vibe-philosophy',
    };
    // Try exact match first, then case-insensitive match
    if (vibeMap[vibe]) {
      return vibeMap[vibe];
    }
    const lowerVibe = vibe.toLowerCase();
    const matchedKey = Object.keys(vibeMap).find(key => key.toLowerCase() === lowerVibe);
    return matchedKey ? vibeMap[matchedKey] : 'vibe-default';
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${book.title}"?`)) {
      onDelete(book.id);
    }
  };

  return (
    <div className="book-card">
      <div className="book-card-header">
        <h3 className="book-title">{book.title}</h3>
        <div className="book-rating">
          <span className={`rating-value ${getRatingColor(book.rating)}`}>
            {book.rating}/10
          </span>
        </div>
      </div>
      
      <div className="book-card-body">
        <p className="book-author">by {book.author}</p>
        
        <div className="book-meta">
          {book.genre && (
            <span className="meta-item">
              <span className="meta-label">Genre:</span> {book.genre}
            </span>
          )}
          {book.pages > 0 && (
            <span className="meta-item">
              <span className="meta-label">Pages:</span>{' '}
              {book.didNotFinish && book.pagesRead !== undefined
                ? `${book.pagesRead}/${book.pages}`
                : book.pages}
            </span>
          )}
          <span className="meta-item">
            <span className="meta-label">Language:</span> {book.language}
          </span>
        </div>

        <div className="book-badges">
          <span className={formatBadgeClass}>{book.format}</span>
          {book.didNotFinish && (
            <span className="vibe-badge vibe-default">Did not finish</span>
          )}
          {vibes.length > 0 && vibes.map((vibe, index) => (
            <span key={index} className={`vibe-badge ${getVibeColorClass(vibe)}`}>
              {vibe}
            </span>
          ))}
        </div>

        {book.notes && (
          <div className="book-notes">
            <p className="notes-label">Notes:</p>
            <p className="notes-content">{book.notes}</p>
          </div>
        )}
      </div>

      <div className="book-card-actions">
        <button onClick={() => onEdit(book)} className="btn btn-sm btn-primary">
          Edit
        </button>
        <button onClick={handleDelete} className="btn btn-sm btn-danger">
          Delete
        </button>
      </div>
    </div>
  );
}
