import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)
  const [julesData, setJulesData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFetchSources = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await window.electronAPI.getJulesSources()
      setJulesData(result)
    } catch (err: any) {
      setError(err)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <nav className="glass-nav">
        <div className="logo">Questline</div>
        <div className="status">System Online</div>
      </nav>

      <main className="content" style={{ overflowY: 'auto' }}>
        <header className="hero">
          <h1>React <span className="gradient-text">+</span> Jules</h1>
          <p className="subtitle">L'IA Autonome de Google directement sur votre bureau</p>
        </header>

        <section className="card-section">
          <div className="glass-card">
            <h2>Sources Jules</h2>
            <p>Liste les dépôts GitHub connectés à votre compte Jules.</p>
            <button onClick={handleFetchSources} disabled={loading}>
              {loading ? "Connexion..." : "Lister les Sources"}
            </button>

            {error && (
              <p style={{ color: '#ff4d4d', fontSize: '0.8rem', marginTop: '1rem' }}>
                ❌ {error} (Pensez à ajouter votre clé API)
              </p>
            )}

            {julesData?.sources && (
              <div style={{ marginTop: '1.5rem', textAlign: 'left', width: '100%' }}>
                <h3 style={{ fontSize: '0.9rem', color: '#00f2fe' }}>Sources détectées :</h3>
                <ul style={{ paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                  {julesData.sources.map((s: any) => (
                    <li key={s.name} style={{ marginBottom: '0.5rem' }}>{s.displayName || s.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="glass-card">
            <h2>Statut Session</h2>
            <p>Interagissez avec Jules pour automatiser vos tâches de code.</p>
            <button onClick={() => setCount((c) => c + 1)}>
              Interaction Count: {count}
            </button>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>© 2026 Questline Project - Powered by Jules API</p>
      </footer>
    </div>
  )
}

export default App
