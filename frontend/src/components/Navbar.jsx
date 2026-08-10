import React from 'react';
import {
  Layers,
  BarChart3,
  Mic2,
  DollarSign,
  FileText,
  LogOut,
  Server,
  Activity
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onLogout }) {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      background: 'rgba(9, 10, 15, 0.92)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '10px 0',
      marginBottom: '24px'
    }}>
      <div style={{
        maxWidth: '1380px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        {/* Brand & System Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--bg-surface-raised)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)'
            }}>
              <Activity size={15} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em'
              }}>
                AutoAce AI
              </span>
              <span style={{
                fontSize: '10.5px',
                color: 'var(--text-muted)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                padding: '1px 6px',
                borderRadius: 'var(--radius-xs)',
                fontWeight: 500
              }}>
                Trial v1.0
              </span>
            </div>
          </div>

          {/* Understated Live Telemetry Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: 'var(--text-muted)',
            paddingLeft: '12px',
            borderLeft: '1px solid var(--border-subtle)'
          }}>
            <span style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--status-success)',
              boxShadow: '0 0 6px rgba(16, 185, 129, 0.4)'
            }} />
            <span style={{ color: 'var(--text-secondary)' }}>
              In-Process DSP
            </span>
            <span>•</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>
              $0.00018/min
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tab-group" aria-label="Main Navigation">
          <button
            className={`nav-tab-item ${activeTab === 'batch' ? 'active' : ''}`}
            onClick={() => setActiveTab('batch')}
          >
            <Layers size={14} />
            <span>Batch Evaluation</span>
          </button>

          <button
            className={`nav-tab-item ${activeTab === 'playground' ? 'active' : ''}`}
            onClick={() => setActiveTab('playground')}
          >
            <Mic2 size={14} />
            <span>Playground</span>
          </button>

          <button
            className={`nav-tab-item ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}
          >
            <BarChart3 size={14} />
            <span>Validation</span>
          </button>

          <button
            className={`nav-tab-item ${activeTab === 'calculator' ? 'active' : ''}`}
            onClick={() => setActiveTab('calculator')}
          >
            <DollarSign size={14} />
            <span>Cost & Latency</span>
          </button>

          <button
            className={`nav-tab-item ${activeTab === 'memo' ? 'active' : ''}`}
            onClick={() => setActiveTab('memo')}
          >
            <FileText size={14} />
            <span>Technical Memo</span>
          </button>
        </nav>

        {/* Evaluator User & Session */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px'
          }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
              {user?.username || 'evaluator@autoace.ai'}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
              ({user?.role || 'Evaluator'})
            </span>
          </div>

          <button
            onClick={onLogout}
            title="Sign out"
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px' }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
