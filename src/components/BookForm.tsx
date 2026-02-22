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
    notes: '',
    didNotFinish: false,
    pagesRead: undefined
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
        notes: book.notes,
        didNotFinish: book.didNotFinish || false,
        pagesRead: book.pagesRead
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

    if (formData.didNotFinish) {
      if (formData.pagesRead === undefined || formData.pagesRead === null) {
        newErrors.pagesRead = 'Pages read is required when "Did not finish" is checked';
      } else if (formData.pagesRead < 0) {
        newErrors.pagesRead = 'Pages read must be a positive number';
      } else if (formData.pagesRead > formData.pages) {
        newErrors.pagesRead = 'Pages read cannot exceed total pages';
      }
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
          notes: '',
          didNotFinish: false,
          pagesRead: undefined
        });
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => {
      const newData = { ...prev };
      
      if (type === 'checkbox') {
        newData[name as keyof BookInput] = checked as any;
        // Clear pagesRead when unchecking didNotFinish
        if (name === 'didNotFinish' && !checked) {
          newData.pagesRead = undefined;
        }
      } else if (name === 'pagesRead') {
        // Handle empty string for pagesRead - set to undefined instead of 0
        newData.pagesRead = value === '' ? undefined : Number(value);
      } else if (name === 'pages' || name === 'rating') {
        newData[name as keyof BookInput] = Number(value) as any;
      } else {
        newData[name as keyof BookInput] = value as any;
      }
      
      return newData;
    });
    
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
        <label htmlFor="didNotFinish" className="checkbox-label">
          <input
            type="checkbox"
            id="didNotFinish"
            name="didNotFinish"
            checked={formData.didNotFinish || false}
            onChange={handleChange}
          />
          Did not finish
        </label>
      </div>

      {formData.didNotFinish && (
        <div className="form-group">
          <label htmlFor="pagesRead">Pages Read</label>
          <input
            type="number"
            id="pagesRead"
            name="pagesRead"
            value={formData.pagesRead ?? ''}
            onChange={handleChange}
            min="0"
            max={formData.pages}
            className={errors.pagesRead ? 'error' : ''}
          />
          {errors.pagesRead && <span className="error-message">{errors.pagesRead}</span>}
        </div>
      )}

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
