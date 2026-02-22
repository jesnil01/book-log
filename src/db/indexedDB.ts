import type { Book, BookInput } from '../types/book';

const DB_NAME = 'BookLogDB';
const DB_VERSION = 6;
const STORE_NAME = 'books';
const TAGS_STORE_NAME = 'usedTags';

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
      const transaction = (event.target as IDBOpenDBRequest).transaction;
      
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
      } else {
        // Upgrade existing store
        const objectStore = transaction!.objectStore(STORE_NAME);
        
        // Remove old vibe index if it exists (we use vibes array now)
        if (objectStore.indexNames.contains('vibe')) {
          objectStore.deleteIndex('vibe');
        }
      }

      // Create usedTags object store if it doesn't exist
      if (!db.objectStoreNames.contains(TAGS_STORE_NAME)) {
        const tagsStore = db.createObjectStore(TAGS_STORE_NAME, {
          keyPath: 'tag',
          autoIncrement: false
        });
        tagsStore.createIndex('tag', 'tag', { unique: true });
        
        // Prepopulate tags from existing books
        if (db.objectStoreNames.contains(STORE_NAME)) {
          const booksStore = transaction!.objectStore(STORE_NAME);
          const getAllRequest = booksStore.getAll();
          
          getAllRequest.onsuccess = () => {
            const books = getAllRequest.result;
            const allTags = new Set<string>();
            
            books.forEach((book: any) => {
              if (book.vibes && Array.isArray(book.vibes)) {
                book.vibes.forEach((tag: string) => {
                  if (tag && tag.trim()) {
                    allTags.add(tag.trim());
                  }
                });
              } else if (book.vibe && book.vibe !== 'Ingen vibe') {
                allTags.add(book.vibe.trim());
              }
            });
            
            // Add all tags to the usedTags store
            allTags.forEach(tag => {
              tagsStore.add({ tag, count: 1 });
            });
          };
        }
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
        vibes: bookInput.vibes || [],
        id: generateId(),
        createdAt: now,
        updatedAt: now
      };

      const request = store.add(book);

      request.onsuccess = async () => {
        // Update used tags
        if (book.vibes && book.vibes.length > 0) {
          try {
            await updateUsedTags(book.vibes);
          } catch (error) {
            console.warn('Failed to update used tags:', error);
          }
        }
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
        const books = request.result.map((book: any) => {
          // Migrate old vibe field to vibes array
          let vibes: string[] = [];
          if (book.vibes && Array.isArray(book.vibes)) {
            vibes = book.vibes;
          } else if (book.vibe && book.vibe !== 'Ingen vibe') {
            vibes = [book.vibe];
          }
          
          return {
            ...book,
            vibes,
            didNotFinish: book.didNotFinish !== undefined ? book.didNotFinish : false,
            pagesRead: book.pagesRead !== undefined ? book.pagesRead : undefined,
            createdAt: new Date(book.createdAt),
            updatedAt: new Date(book.updatedAt)
          };
        });
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
          // Migrate old vibe field to vibes array
          let vibes: string[] = [];
          if (book.vibes && Array.isArray(book.vibes)) {
            vibes = book.vibes;
          } else if (book.vibe && book.vibe !== 'Ingen vibe') {
            vibes = [book.vibe];
          }
          
          resolve({
            ...book,
            vibes,
            didNotFinish: book.didNotFinish !== undefined ? book.didNotFinish : false,
            pagesRead: book.pagesRead !== undefined ? book.pagesRead : undefined,
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
          vibes: updates.vibes !== undefined ? (updates.vibes || []) : (existingBook.vibes || []),
          id: existingBook.id,
          createdAt: existingBook.createdAt,
          updatedAt: new Date()
        };

        const putRequest = store.put(updatedBook);

        putRequest.onsuccess = async () => {
          // Update used tags
          if (updatedBook.vibes && updatedBook.vibes.length > 0) {
            try {
              await updateUsedTags(updatedBook.vibes);
            } catch (error) {
              console.warn('Failed to update used tags:', error);
            }
          }
          resolve({
            ...updatedBook,
            vibes: updatedBook.vibes || [],
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

/**
 * Get all used tags from the database
 */
export function getAllUsedTags(): Promise<string[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      if (!db.objectStoreNames.contains(TAGS_STORE_NAME)) {
        resolve([]);
        return;
      }
      
      const transaction = db.transaction([TAGS_STORE_NAME], 'readonly');
      const store = transaction.objectStore(TAGS_STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const tags = request.result.map((item: any) => item.tag);
        resolve(tags);
      };

      request.onerror = () => {
        reject(new Error('Failed to get used tags'));
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Update used tags in the database
 */
export function updateUsedTags(tags: string[]): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      if (!db.objectStoreNames.contains(TAGS_STORE_NAME)) {
        resolve();
        return;
      }
      
      const transaction = db.transaction([TAGS_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(TAGS_STORE_NAME);
      
      const normalizedTags = tags
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      const updatePromises = normalizedTags.map(tag => {
        return new Promise<void>((resolveTag, rejectTag) => {
          const getRequest = store.get(tag);
          
          getRequest.onsuccess = () => {
            if (getRequest.result) {
              // Tag exists, increment count
              const updated = {
                ...getRequest.result,
                count: (getRequest.result.count || 1) + 1
              };
              const putRequest = store.put(updated);
              putRequest.onsuccess = () => resolveTag();
              putRequest.onerror = () => rejectTag(new Error(`Failed to update tag: ${tag}`));
            } else {
              // New tag, add it
              const addRequest = store.add({ tag, count: 1 });
              addRequest.onsuccess = () => resolveTag();
              addRequest.onerror = () => {
                // Ignore constraint errors (tag already exists)
                resolveTag();
              };
            }
          };
          
          getRequest.onerror = () => rejectTag(new Error(`Failed to get tag: ${tag}`));
        });
      });
      
      Promise.all(updatePromises)
        .then(() => resolve())
        .catch(error => reject(error));
    } catch (error) {
      reject(error);
    }
  });
}
