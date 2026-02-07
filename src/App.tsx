import { useEffect, useState } from 'react'
import { initDB } from './db/indexedDB'

function App() {
  const [dbReady, setDbReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initDB()
      .then(() => {
        setDbReady(true)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to initialize database')
      })
  }, [])

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: 'red' }}>Error: {error}</p>
        <p>Please refresh the page to try again.</p>
      </div>
    )
  }

  if (!dbReady) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Hello World</h1>
      <p>Book Log App</p>
    </div>
  )
}

export default App
