import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="container">
      <nav className="glass-nav">
        <div className="logo">Questline</div>
        <div className="status">System Online</div>
      </nav>
      
      <main className="content">
        <header className="hero">
          <h1>React <span className="gradient-text">+</span> Electron</h1>
          <p className="subtitle">High Performance Desktop Experience</p>
        </header>

        <section className="card-section">
          <div className="glass-card">
            <h2>Desktop Power</h2>
            <p>Access native system features with TypeScript safety.</p>
            <div className="counter-box">
              <button onClick={() => setCount((count) => count + 1)}>
                Interaction Count: {count}
              </button>
            </div>
          </div>

          <div className="glass-card">
            <h2>Vite Speed</h2>
            <p>Instant Hot Module Replacement for rapid development.</p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>© 2026 Questline Project - Premium Suite</p>
      </footer>
    </div>
  )
}

export default App
