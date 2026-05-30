import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function SettingsPage() {
  const [keyInput, setKeyInput] = useState('');
  const [hasKey, setHasKey]     = useState(false);
  const [saving, setSaving]     = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    window.electronAPI.hasApiKey().then(setHasKey);
  }, []);

  const handleSave = async () => {
    if (!keyInput.trim()) return;
    setSaving(true);
    setFeedback(null);
    try {
      await window.electronAPI.saveApiKey(keyInput);
      setHasKey(true);
      setKeyInput('');
      setFeedback({ type: 'success', msg: 'Clé API sauvegardée et chiffrée avec succès.' });
    } catch (err: unknown) {
      setFeedback({ type: 'error', msg: err instanceof Error ? err.message : String(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    try {
      await window.electronAPI.clearApiKey();
      setHasKey(false);
      setKeyInput('');
      setFeedback({ type: 'success', msg: 'Clé API supprimée.' });
    } catch (err: unknown) {
      setFeedback({ type: 'error', msg: err instanceof Error ? err.message : 'Erreur lors de la suppression.' });
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 640 }}>

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Paramètres</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>Configuration de votre instance Jules</p>
      </div>

      {/* API Key card */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ fontWeight: 600 }}>Clé API Jules</p>
          <span className={hasKey ? 'badge badge-lime' : 'badge badge-red'}>
            {hasKey ? 'Configurée' : 'Non configurée'}
          </span>
        </div>

        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: '1rem' }}>
          La clé est chiffrée par l'OS (Windows DPAPI) et stockée localement. Elle ne quitte jamais votre machine.
        </p>

        <input
          type="password"
          value={keyInput}
          onChange={e => setKeyInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder={hasKey
            ? 'Clé déjà configurée — saisissez-en une nouvelle pour remplacer'
            : 'Collez votre clé API Jules ici'}
          style={{ marginBottom: '1rem', fontFamily: 'monospace' }}
        />

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving || !keyInput.trim()}
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
          {hasKey && (
            <button className="btn-danger" onClick={handleClear}>
              Effacer
            </button>
          )}
        </div>

        {feedback && (
          <p style={{ marginTop: 12, fontSize: 12, color: feedback.type === 'success' ? 'var(--lime)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {feedback.type === 'success' ? <CheckCircle2 size={13} strokeWidth={2} /> : <XCircle size={13} strokeWidth={2} />}
            {feedback.msg}
          </p>
        )}
      </div>

      {/* Instructions card */}
      <div className="card">
        <p style={{ fontWeight: 600, marginBottom: 12 }}>Où trouver ma clé API ?</p>
        <ol style={{ paddingLeft: '1.2rem', fontSize: 12, color: 'var(--muted)', lineHeight: 2, marginBottom: 12 }}>
          <li>Connecte-toi sur <span style={{ color: 'var(--cyan)', fontFamily: 'monospace' }}>jules.google.com</span></li>
          <li>Va dans <strong style={{ color: 'var(--text)' }}>Settings &gt; API Keys</strong></li>
          <li>Crée ou copie ta clé API (max 3 clés par compte)</li>
          <li>Colle-la dans le champ ci-dessus et sauvegarde</li>
        </ol>
        <p style={{ fontSize: 11, color: 'var(--muted)' }}>
          Jules offre <strong style={{ color: 'var(--text)' }}>15 agents IA par jour</strong> gratuitement par compte.
        </p>
      </div>
    </div>
  );
}
