import { useEffect, useState } from 'react'
import { initDB, getAllBooks, addBook, updateBook, deleteBook } from './db/indexedDB'
import type { Book, BookInput } from './types/book'
import { BookForm } from './components/BookForm'
import { BookList } from './components/BookList'
import { BookScrollList } from './components/BookScrollList'

function App() {
  const [dbReady, setDbReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)

  useEffect(() => {
    initDB()
      .then(() => {
        setDbReady(true)
        loadBooks()
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to initialize database')
      })
  }, [])

  const loadBooks = async () => {
    try {
      const allBooks = await getAllBooks()
      // Sort by most recently updated first
      allBooks.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      setBooks(allBooks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load books')
    }
  }

  const handleAddBook = async (bookInput: BookInput) => {
    try {
      await addBook(bookInput)
      await loadBooks()
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add book')
    }
  }

  const handleUpdateBook = async (bookInput: BookInput) => {
    if (!editingBook) return
    
    try {
      await updateBook(editingBook.id, bookInput)
      await loadBooks()
      setEditingBook(null)
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update book')
    }
  }

  const handleDeleteBook = async (id: string) => {
    try {
      await deleteBook(id)
      await loadBooks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete book')
    }
  }

  const handleEditBook = (book: Book) => {
    setEditingBook(book)
    setShowForm(true)
  }

  const handleCancelEdit = () => {
    setEditingBook(null)
    setShowForm(false)
  }

  const handleNewBook = () => {
    setEditingBook(null)
    setShowForm(true)
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">Error: {error}</p>
        <p>Please refresh the page to try again.</p>
      </div>
    )
  }

  if (!dbReady) {
    return (
      <div className="loading-container">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Book Log</h1>
        <p className="subtitle">Track your reading journey</p>
      </header>

      <main className="app-main">
        {showForm ? (
          <div className="form-container">
            <h2>{editingBook ? 'Edit Book' : 'Add New Book'}</h2>
            <BookForm
              book={editingBook || undefined}
              onSubmit={editingBook ? handleUpdateBook : handleAddBook}
              onCancel={handleCancelEdit}
            />
          </div>
        ) : (
          <>
            <div className="actions-bar">
              <button onClick={handleNewBook} className="btn btn-primary btn-large">
                + Add Book
              </button>
            </div>
            <BookScrollList
              books={books}
              onEdit={handleEditBook}
              onDelete={handleDeleteBook}
              title="Your Reading Collection"
            />
            <BookList
              books={books}
              onEdit={handleEditBook}
              onDelete={handleDeleteBook}
            />
          </>
        )}
      </main>
    </div>
  )
}

export default App
