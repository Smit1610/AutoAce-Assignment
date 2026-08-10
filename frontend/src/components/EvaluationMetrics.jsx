import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Target, 
  CheckCircle2, 
  Percent, 
  Award, 
  RefreshCw 
} from 'lucide-react';
import { api } from '../utils/api';

export default function EvaluationMetrics({ currentBatch }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentBatch && currentBatch.batch_id && currentBatch.validation_report?.has_labels) {
      loadBatchMetrics(currentBatch.batch_id);
    } else {
      setMetrics(null);
    }
  }, [currentBatch]);

  const loadBatchMetrics = async (batchId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/batch/${batchId}/metrics`);
      if (!res.ok) throw new Error('Failed calculating batch confusion metrics');
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadReferenceBenchmark = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getReferenceBenchmarkMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err.message || 'Failed fetching benchmark metrics');
    } finally {
      setLoading(false);
    }
  };

  if (!metrics && !loading) {
    return (
      <div className="surface-panel" style={{ padding: '36px 24px', textAlign: 'center', marginBottom: '20px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-default)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px',
          color: 'var(--text-muted)'
        }}>
          <BarChart3 size={20} />
        </div>

        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
          No Ground-Truth Evaluation Available
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', maxWidth: '480px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
          Confusion Matrices, Macro F1, and Precision/Recall are calculated dynamically when an audio batch with a <code>labels.csv</code> manifest is uploaded.
        </p>

        <button
          onClick={loadReferenceBenchmark}
          className="btn btn-secondary btn-sm"
        >
          <RefreshCw size={13} /> Load Reference Benchmark Suite
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="surface-panel" style={{ padding: '48px', textAlign: 'center' }}>
        <span className="spin-icon" style={{ fontSize: '20px', display: 'block', marginBottom: '8px' }}>⚙</span>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Calculating confusion matrix & Macro F1 metrics...</p>
      </div>
    );
  }

  const toneCm = metrics.emotional_tone_metrics;

  return (
    <div>
      {/* Top 4 KPI Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div className="surface-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Overall Macro F1
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '4px' }}>
            {(metrics.overall_macro_f1 * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Unweighted multi-class average
          </div>
        </div>

        <div className="surface-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Tone Accuracy
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--status-success)', marginTop: '4px' }}>
            {(toneCm.accuracy * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            5-class emotional classification
          </div>
        </div>

        <div className="surface-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Noise Detection F1
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--status-warning)', marginTop: '4px' }}>
            {(metrics.background_noise_present_metrics.macro_f1 * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Acoustic non-speech detection
          </div>
        </div>

        <div className="surface-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Audio Quality Accuracy
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--status-purple)', marginTop: '4px' }}>
            {(metrics.audio_quality_metrics.accuracy * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Clipping & packet impairment
          </div>
        </div>
      </div>

      {/* Confusion Matrix & Per-Class Table */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1.2fr) minmax(320px, 1fr)', gap: '20px', marginBottom: '20px' }}>
        {/* Confusion Matrix Table */}
        <div className="surface-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '2px' }}>
            Emotional Tone Confusion Matrix
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '11.5px', marginBottom: '14px' }}>
            Rows represent ground truth; columns represent model predictions.
          </p>

          <div className="data-table-container">
            <table className="data-table" style={{ textAlign: 'center' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', background: 'transparent' }}>True \ Pred</th>
                  {toneCm.classes.map((cls, i) => (
                    <th key={i} style={{ textTransform: 'capitalize', textAlign: 'center' }}>
                      {cls}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {toneCm.classes.map((rowClass, rIdx) => (
                  <tr key={rIdx}>
                    <td style={{ textAlign: 'left', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {rowClass}
                    </td>
                    {toneCm.matrix[rIdx]?.map((val, cIdx) => {
                      const isDiag = rIdx === cIdx;
                      return (
                        <td
                          key={cIdx}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '12px',
                            fontWeight: isDiag && val > 0 ? 600 : 400,
                            color: isDiag && val > 0 ? 'var(--status-success)' : val > 0 ? 'var(--text-primary)' : 'var(--text-disabled)',
                            background: isDiag && val > 0 ? 'var(--status-success-bg)' : 'transparent'
                          }}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Per-Class Metrics */}
        <div className="surface-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>
            Per-Class Performance
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(toneCm.per_class_metrics).map(([clsName, stats]) => (
              <div key={clsName} style={{
                background: 'var(--bg-subtle)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                    {clsName}
                  </span>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    Precision: {(stats.precision * 100).toFixed(0)}% • Recall: {(stats.recall * 100).toFixed(0)}%
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {(stats.f1 * 100).toFixed(1)}%
                  </span>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {stats.support} calls
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
