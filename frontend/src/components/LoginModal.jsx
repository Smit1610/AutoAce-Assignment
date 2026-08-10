import React, { useState } from 'react';
import { Lock, User, ArrowRight, Shield, CheckCircle } from 'lucide-react';
import { api } from '../utils/api';

export default function LoginModal({ onLoginSuccess }) {
  const [username, setUsername] = useState('evaluator@autoace.ai');
  const [password, setPassword] = useState('AutoAce@2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(username, password);
      onLoginSuccess(res);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = (userType) => {
    if (userType === 'evaluator') {
      setUsername('evaluator@autoace.ai');
      setPassword('AutoAce@2026');
    } else {
      setUsername('admin@autoace.ai');
      setPassword('AutoAceProduction!2026');
    }
    setTimeout(() => {
      handleSubmit();
    }, 50);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '440px', padding: '32px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 25px rgba(6, 182, 212, 0.4)',
            marginBottom: '16px'
          }}>
            <Shield size={28} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '22px', marginBottom: '6px' }}>AutoAce AI Evaluation Portal</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Enter your evaluator credentials to access the batch assessment dashboard.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            color: '#fca5a5',
            fontSize: '12.5px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Evaluator Email / Username
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0 12px'
            }}>
              <User size={16} color="var(--text-muted)" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  padding: '10px',
                  fontSize: '13.5px'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0 12px'
            }}>
              <Lock size={16} color="var(--text-muted)" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  padding: '10px',
                  fontSize: '13.5px'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '6px' }}
          >
            {loading ? 'Authenticating...' : 'Access Evaluation System'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Credentials Helper */}
        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '11.5px',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#38bdf8' }}>
            <CheckCircle size={13} />
            <strong>Pre-filled Trial Credentials:</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px', marginBottom: '6px' }}>
            <span>User: <code>evaluator@autoace.ai</code></span>
            <span>Pass: <code>AutoAce@2026</code></span>
          </div>
          <button 
            type="button"
            onClick={() => quickDemoLogin('evaluator')}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', fontSize: '11px', marginTop: '4px' }}
          >
            1-Click Instant Login as Lead Evaluator
          </button>
        </div>
      </div>
    </div>
  );
}
