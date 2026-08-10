import React, { useState } from 'react';
import { 
  Upload, 
  Activity, 
  Sliders, 
  ShieldAlert, 
  Copy, 
  Check, 
  Play, 
  Music,
  Info
} from 'lucide-react';
import { api } from '../utils/api';

export default function AudioPlayground() {
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [activeCallId, setActiveCallId] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const testReferenceCall = async (callId) => {
    setLoading(true);
    setError(null);
    setActiveCallId(callId);
    try {
      const data = await api.analyzeReferenceCall(callId);
      setResultData(data);
    } catch (err) {
      setError(err.message || 'Failed analyzing reference call');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setActiveCallId(file.name);
    try {
      const data = await api.analyzeSingleAudio(file);
      setResultData(data);
    } catch (err) {
      setError(err.message || 'Analysis error on uploaded audio file');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJson = (obj) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderToneTag = (tone) => {
    const toneMap = {
      neutral: { class: 'tag-neutral', label: 'neutral' },
      satisfied: { class: 'tag-satisfied', label: 'satisfied' },
      frustrated: { class: 'tag-frustrated', label: 'frustrated' },
      upset: { class: 'tag-upset', label: 'upset' },
      distressed: { class: 'tag-distressed', label: 'distressed' }
    };
    const conf = toneMap[tone] || { class: 'tag-neutral', label: tone };
    return (
      <span className={`status-tag ${conf.class}`}>
        <span className="status-dot" />
        <span>{conf.label}</span>
      </span>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(440px, 1.8fr)', gap: '20px' }}>
      {/* Left Control Panel */}
      <div className="surface-panel" style={{ padding: '20px', height: 'fit-content' }}>
        <h2 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Activity size={16} color="var(--accent-primary)" />
          Acoustic Playground
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px', lineHeight: 1.5 }}>
          Upload any single audio clip to inspect live DSP telemetry and prosodic feature extraction.
        </p>

        {/* Custom Audio File Upload */}
        <div style={{
          padding: '18px 14px',
          background: 'var(--bg-subtle)',
          border: '1px dashed var(--border-strong)',
          borderRadius: 'var(--radius-sm)',
          textAlign: 'center',
          marginBottom: '16px'
        }}>
          <input
            type="file"
            id="single-audio-upload"
            accept="audio/*,.wav,.mp3,.ogg,.flac,.m4a"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <label htmlFor="single-audio-upload" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
            <Upload size={13} /> Select Audio Clip (.wav, .mp3)
          </label>
        </div>

        {/* Reference Call Presets */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Reference Production Calls
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => testReferenceCall('call_001.wav')}
              disabled={loading}
              className={`btn btn-ghost btn-sm ${activeCallId === 'call_001.wav' ? 'active' : ''}`}
              style={{ justifyContent: 'space-between', width: '100%', padding: '7px 10px', background: activeCallId === 'call_001.wav' ? 'var(--bg-surface-raised)' : 'transparent', border: '1px solid var(--border-subtle)' }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>call_001.wav</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>4.5s</span>
            </button>

            <button
              onClick={() => testReferenceCall('call_002.mp3')}
              disabled={loading}
              className={`btn btn-ghost btn-sm ${activeCallId === 'call_002.mp3' ? 'active' : ''}`}
              style={{ justifyContent: 'space-between', width: '100%', padding: '7px 10px', background: activeCallId === 'call_002.mp3' ? 'var(--bg-surface-raised)' : 'transparent', border: '1px solid var(--border-subtle)' }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>call_002.mp3</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>4.0s</span>
            </button>

            <button
              onClick={() => testReferenceCall('call_003.wav')}
              disabled={loading}
              className={`btn btn-ghost btn-sm ${activeCallId === 'call_003.wav' ? 'active' : ''}`}
              style={{ justifyContent: 'space-between', width: '100%', padding: '7px 10px', background: activeCallId === 'call_003.wav' ? 'var(--bg-surface-raised)' : 'transparent', border: '1px solid var(--border-subtle)' }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>call_003.wav</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>5.0s</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Analysis Breakdown */}
      <div className="surface-panel" style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <span className="spin-icon" style={{ fontSize: '20px', display: 'block', marginBottom: '8px' }}>⚙</span>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Executing in-process acoustic DSP pipeline...</p>
          </div>
        ) : error ? (
          <div style={{
            background: 'var(--status-danger-bg)',
            border: '1px solid var(--status-danger-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            textAlign: 'center',
            color: '#fb7185'
          }}>
            <ShieldAlert size={22} style={{ marginBottom: '6px' }} />
            <h4 style={{ fontSize: '13.5px', fontWeight: 600 }}>Analysis Error</h4>
            <p style={{ fontSize: '12px', marginTop: '3px' }}>{error}</p>
          </div>
        ) : resultData ? (
          <div>
            {/* Header Telemetry */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Analyzed Audio:</span>
                <h3 style={{ fontSize: '15px', fontFamily: 'var(--font-mono)' }}>{resultData.filename}</h3>
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {renderToneTag(resultData.result.emotional_tone)}
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  ({resultData.result.emotional_intensity})
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--status-success)', marginLeft: '4px' }}>
                  {(resultData.result.confidence * 100).toFixed(0)}% conf
                </span>
              </div>
            </div>

            {/* Acoustic DSP Telemetry Grid */}
            {resultData.diagnostics && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <div style={{ background: 'var(--bg-subtle)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Pitch (F0)</span>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {resultData.diagnostics.pitch_f0_mean_hz} Hz
                  </div>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Centroid</span>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {resultData.diagnostics.spectral_centroid_hz} Hz
                  </div>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>SNR</span>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--status-success)' }}>
                    {resultData.diagnostics.snr_db} dB
                  </div>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Speech Ratio</span>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {(resultData.diagnostics.speech_ratio * 100).toFixed(0)}%
                  </div>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Latency</span>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>
                    {resultData.diagnostics.processing_time_ms} ms
                  </div>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Unit Cost</span>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--status-success)' }}>
                    ${resultData.diagnostics.cost_usd.toFixed(6)}
                  </div>
                </div>
              </div>
            )}

            {/* Structured Schema JSON */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 500, color: 'var(--text-muted)' }}>
                  Output Schema (JSON):
                </span>
                <button
                  onClick={() => handleCopyJson(resultData.result)}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '2px 6px', fontSize: '11px' }}
                >
                  {copied ? <Check size={12} color="var(--status-success)" /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre style={{
                background: 'var(--bg-canvas)',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                fontSize: '12px',
                color: 'var(--text-primary)',
                overflowX: 'auto',
                lineHeight: 1.45
              }}>
                {JSON.stringify(resultData.result, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
            <Sliders size={22} style={{ marginBottom: '8px', opacity: 0.5 }} />
            <h4 style={{ fontSize: '13.5px', color: 'var(--text-primary)', marginBottom: '3px' }}>
              No Audio Clip Loaded
            </h4>
            <p style={{ fontSize: '12px', maxWidth: '360px', margin: '0 auto' }}>
              Select a reference production call on the left or upload an audio file to extract acoustic features in real time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
