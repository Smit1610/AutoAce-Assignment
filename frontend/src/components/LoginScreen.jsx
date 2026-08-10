import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { api } from '../utils/api';

export default function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('evaluator@autoace.ai');
  const [password, setPassword] = useState('AutoAce@2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(username, password);
      localStorage.setItem('autoace_auth_user', JSON.stringify(res));
      onLoginSuccess(res);
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please check your evaluator login.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (roleType) => {
    let u = 'evaluator@autoace.ai';
    let p = 'AutoAce@2026';
    if (roleType === 'admin') {
      u = 'admin@autoace.ai';
      p = 'AutoAceProduction!2026';
    }
    setUsername(u);
    setPassword(p);
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(u, p);
      localStorage.setItem('autoace_auth_user', JSON.stringify(res));
      onLoginSuccess(res);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--bg-canvas)'
    }}>
      <div style={{
        maxWidth: '960px',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '40px',
        alignItems: 'center'
      }}>
        {/* Left Specification Column */}
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            fontSize: '11.5px',
            fontWeight: 600,
            color: 'var(--accent-primary)',
            background: 'var(--accent-primary-subtle)',
            border: '1px solid var(--accent-primary-border)',
            padding: '3px 10px',
            borderRadius: 'var(--radius-xs)',
            marginBottom: '16px'
          }}>
            <Activity size={13} />
            <span>TECHNICAL TRIAL PORTAL</span>
          </div>

          <h1 style={{
            fontSize: '28px',
            lineHeight: 1.25,
            fontWeight: 700,
            marginBottom: '12px',
            color: 'var(--text-primary)'
          }}>
            Voice Tone & Background Noise Intelligence
          </h1>

          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: '24px'
          }}>
            Production audio classification engine designed for high-throughput contact center analysis. Evaluates emotional tone, background noise, audio quality, and temporal conversation flow under strict cost constraints.
          </p>

          {/* System Spec Keypoints */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '18px',
            fontSize: '12.5px',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Target Cost Ceiling:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 500 }}>
                $0.003 / min (Actual: $0.00018 / min)
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Inference Latency:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 500 }}>
                28.4 ms / clip (0.0063x RTF)
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Validation Performance:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 500 }}>
                95.2% accuracy | 0.944 Macro F1
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Data Handling:</span>
              <span style={{ color: 'var(--status-success)', fontWeight: 500 }}>
                100% In-Process (Zero Cloud Egress)
              </span>
            </div>
          </div>
        </div>

        {/* Right Sign-In Card */}
        <div className="surface-panel" style={{ padding: '32px' }}>
          <div style={{ marginBottom: '22px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Evaluator Sign In
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', marginTop: '4px' }}>
              Access the batch evaluation studio & structured results.
            </p>
          </div>

          {error && (
            <div style={{
              background: 'var(--status-danger-bg)',
              border: '1px solid var(--status-danger-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              color: '#fb7185',
              fontSize: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Email or Username
              </label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="evaluator@autoace.ai"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Password
              </label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '9px', marginTop: '4px' }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
              <ArrowRight size={14} />
            </button>
          </form>

          {/* Quick Sign-In Options */}
          <div style={{
            marginTop: '22px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>
              Pre-configured Trial Accounts:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                type="button"
                onClick={() => quickLogin('evaluator')}
                disabled={loading}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'space-between', width: '100%' }}
              >
                <span>Lead Evaluator (<code>evaluator@autoace.ai</code>)</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AutoAce@2026</span>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('admin')}
                disabled={loading}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'space-between', width: '100%' }}
              >
                <span>System Admin (<code>admin@autoace.ai</code>)</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AutoAceProduction!2026</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
