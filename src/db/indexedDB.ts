import type { Book, BookInput } from '../types/book';

const DB_NAME = 'BookLogDB';
const DB_VERSION = 2;
const STORE_NAME = 'books';

let dbInstance: IDBDatabase | null = null;

/**
 * Initialize or upgrade the IndexedDB database
 * @returns {Promise<IDBDatabase>}
 */
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open database'));
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create books object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: false
        });

        // Create indexes for efficient querying
        objectStore.createIndex('title', 'title', { unique: false });
        objectStore.createIndex('author', 'author', { unique: false });
        objectStore.createIndex('genre', 'genre', { unique: false });
        objectStore.createIndex('language', 'language', { unique: false });
        objectStore.createIndex('format', 'format', { unique: false });
        objectStore.createIndex('rating', 'rating', { unique: false });
        objectStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
      
      console.log('Database initialized');
    };
  });
}

/**
 * Get the database instance
 */
function getDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  return initDB();
}

/**
 * Generate a unique ID for a book
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Add a new book to the database
 */
export function addBook(bookInput: BookInput): Promise<Book> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const now = new Date();
      const book: Book = {
        ...bookInput,
        id: generateId(),
        createdAt: now,
        updatedAt: now
      };

      const request = store.add(book);

      request.onsuccess = () => {
        resolve(book);
      };

      request.onerror = () => {
        reject(new Error('Failed to add book'));
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get all books from the database
 */
export function getAllBooks(): Promise<Book[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const books = request.result.map((book: any) => ({
          ...book,
          createdAt: new Date(book.createdAt),
          updatedAt: new Date(book.updatedAt)
        }));
        resolve(books);
      };

      request.onerror = () => {
        reject(new Error('Failed to get books'));
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get a book by ID
 */
export function getBookById(id: string): Promise<Book | null> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const book = request.result;
        if (book) {
          resolve({
            ...book,
            createdAt: new Date(book.createdAt),
            updatedAt: new Date(book.updatedAt)
          });
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to get book'));
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Update a book in the database
 */
export function updateBook(id: string, updates: Partial<BookInput>): Promise<Book> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const existingBook = getRequest.result;
        if (!existingBook) {
          reject(new Error('Book not found'));
          return;
        }

        const updatedBook: Book = {
          ...existingBook,
          ...updates,
          id: existingBook.id,
          createdAt: existingBook.createdAt,
          updatedAt: new Date()
        };

        const putRequest = store.put(updatedBook);

        putRequest.onsuccess = () => {
          resolve({
            ...updatedBook,
            createdAt: new Date(updatedBook.createdAt),
            updatedAt: updatedBook.updatedAt
          });
        };

        putRequest.onerror = () => {
          reject(new Error('Failed to update book'));
        };
      };

      getRequest.onerror = () => {
        reject(new Error('Failed to get book for update'));
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Delete a book from the database
 */
export function deleteBook(id: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete book'));
      };
    } catch (error) {
      reject(error);
    }
  });
}
