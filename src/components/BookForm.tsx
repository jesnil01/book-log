import { useState, useEffect } from 'react';
import type { Book, BookInput, Language, Format } from '../types/book';
import { getAllUsedTags } from '../db/indexedDB';
import { TagsInput } from './TagsInput';

interface BookFormProps {
  book?: Book;
  onSubmit: (book: BookInput) => void;
  onCancel?: () => void;
}

export function BookForm({ book, onSubmit, onCancel }: BookFormProps) {
  const [formData, setFormData] = useState<BookInput>({
    title: '',
    author: '',
    genre: '',
    pages: 0,
    language: 'English',
    format: 'Physical',
    vibes: [],
    rating: 5,
    notes: ''
  });

  const [usedTags, setUsedTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof BookInput, string>>>({});

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title,
        author: book.author,
        genre: book.genre,
        pages: book.pages,
        language: book.language,
        format: book.format,
        vibes: book.vibes || [],
        rating: book.rating,
        notes: book.notes
      });
    }
  }, [book]);

  useEffect(() => {
    // Load used tags from database
    getAllUsedTags()
      .then(tags => setUsedTags(tags))
      .catch(error => console.warn('Failed to load used tags:', error));
  }, []);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof BookInput, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.author.trim()) {
      newErrors.author = 'Author is required';
    }

    if (formData.pages < 0) {
      newErrors.pages = 'Pages must be a positive number';
    }

    if (formData.rating < 1 || formData.rating > 10) {
      newErrors.rating = 'Rating must be between 1 and 10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
      // Reset form if not editing
      if (!book) {
        setFormData({
          title: '',
          author: '',
          genre: '',
          pages: 0,
          language: 'English',
          format: 'Physical',
          vibes: [],
          rating: 5,
          notes: ''
        });
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'pages' || name === 'rating' ? Number(value) : value
    }));
    // Clear error when user starts typing
    if (errors[name as keyof BookInput]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof BookInput];
        return newErrors;
      });
    }
  };

  const handleTagsChange = (tags: string[]) => {
    setFormData(prev => ({
      ...prev,
      vibes: tags
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="book-form">
      <div className="form-group">
        <label htmlFor="title">
          Title <span className="required">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={errors.title ? 'error' : ''}
        />
        {errors.title && <span className="error-message">{errors.title}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="author">
          Author <span className="required">*</span>
        </label>
        <input
          type="text"
          id="author"
          name="author"
          value={formData.author}
          onChange={handleChange}
          className={errors.author ? 'error' : ''}
        />
        {errors.author && <span className="error-message">{errors.author}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="genre">Genre</label>
        <input
          type="text"
          id="genre"
          name="genre"
          value={formData.genre}
          onChange={handleChange}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="pages">Number of Pages</label>
          <input
            type="number"
            id="pages"
            name="pages"
            value={formData.pages}
            onChange={handleChange}
            min="0"
            className={errors.pages ? 'error' : ''}
          />
          {errors.pages && <span className="error-message">{errors.pages}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="language">Language</label>
          <select
            id="language"
            name="language"
            value={formData.language}
            onChange={handleChange}
          >
            <option value="English">English</option>
            <option value="Swedish">Swedish</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="format">Format</label>
          <select
            id="format"
            name="format"
            value={formData.format}
            onChange={handleChange}
          >
            <option value="E-book">E-book</option>
            <option value="Physical">Physical</option>
            <option value="Audio">Audio</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="rating">
            Rating (1-10) <span className="required">*</span>
          </label>
          <input
            type="number"
            id="rating"
            name="rating"
            value={formData.rating}
            onChange={handleChange}
            min="1"
            max="10"
            className={errors.rating ? 'error' : ''}
          />
          {errors.rating && <span className="error-message">{errors.rating}</span>}
        </div>
      </div>

      <div className="form-group">
        <label>Vibes</label>
        <TagsInput
          selectedTags={formData.vibes || []}
          onTagsChange={handleTagsChange}
          usedTags={usedTags}
          placeholder="Type to add vibes (e.g., Thriller, Romance)..."
        />
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={4}
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {book ? 'Update Book' : 'Add Book'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
