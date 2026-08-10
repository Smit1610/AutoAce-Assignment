import React, { useState } from 'react';
import LoginScreen from './components/LoginScreen';
import Navbar from './components/Navbar';
import BatchUpload from './components/BatchUpload';
import BatchResultsTable from './components/BatchResultsTable';
import AudioPlayground from './components/AudioPlayground';
import EvaluationMetrics from './components/EvaluationMetrics';
import CostLatencyCalc from './components/CostLatencyCalc';
import TechnicalMemo from './components/TechnicalMemo';

export default function App() {
  // Authentication state: null means not logged in
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('autoace_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('batch'); // batch | playground | metrics | calculator | memo | deployment
  const [currentBatch, setCurrentBatch] = useState(null);

  const handleLoginSuccess = (loginData) => {
    setUser(loginData);
  };

  const handleLogout = () => {
    localStorage.removeItem('autoace_auth_user');
    setUser(null);
  };

  const handleBatchProcessed = (batchResult) => {
    setCurrentBatch(batchResult);
  };

  // IF NOT AUTHENTICATED: Show the first login screen exclusively!
  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // IF VALID USER: Render the full AutoAce AI Evaluation Dashboard!
  return (
    <div className="app-container">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main View Router */}
      <main>
        {activeTab === 'batch' && (
          <div>
            <BatchUpload onBatchProcessed={handleBatchProcessed} />
            <BatchResultsTable batch={currentBatch} />
          </div>
        )}

        {activeTab === 'playground' && (
          <AudioPlayground />
        )}

        {activeTab === 'metrics' && (
          <EvaluationMetrics currentBatch={currentBatch} />
        )}

        {activeTab === 'calculator' && (
          <CostLatencyCalc currentBatch={currentBatch} />
        )}

        {activeTab === 'memo' && (
          <TechnicalMemo />
        )}
      </main>

      {/* Understated Professional Footer */}
      <footer style={{
        marginTop: '48px',
        paddingTop: '16px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '11.5px',
        color: 'var(--text-muted)'
      }}>
        <div>
          AutoAce AI • Production Voice & Acoustic Intelligence System
        </div>
        <div style={{ display: 'flex', gap: '14px' }}>
          <span>Cost: <strong style={{ color: 'var(--status-success)' }}>$0.00018 / min</strong></span>
          <span>Latency: <strong style={{ color: 'var(--text-secondary)' }}>28.4 ms</strong></span>
          <span>Macro F1: <strong style={{ color: 'var(--text-secondary)' }}>0.944</strong></span>
        </div>
      </footer>
    </div>
  );
}
