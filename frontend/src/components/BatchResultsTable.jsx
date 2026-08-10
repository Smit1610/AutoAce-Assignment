import React, { useState } from 'react';
import { 
  Download, 
  FileCode, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Volume2, 
  Eye, 
  Copy, 
  Check, 
  Music, 
  Upload, 
  FileSpreadsheet, 
  Info,
  X
} from 'lucide-react';
import { api } from '../utils/api';

export default function BatchResultsTable({ batch }) {
  const [activeAudio, setActiveAudio] = useState(null);
  const [selectedJsonItem, setSelectedJsonItem] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCopyJson = (obj) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper for tone status tags
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

  // Empty state when no batch has been processed
  if (!batch || !batch.items || batch.items.length === 0) {
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
          <Music size={20} />
        </div>

        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
          No Batch Audio Uploaded Yet
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', maxWidth: '480px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
          Upload a ZIP archive or audio files with a <code>labels.csv</code> manifest in the section above to run inference and inspect real-time results.
        </p>

        {/* 3 Step Guidance */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          maxWidth: '680px',
          margin: '0 auto',
          textAlign: 'left'
        }}>
          <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
              1. Audio Formats
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              WAV, MP3, FLAC, OGG resampled to 16 kHz mono.
            </p>
          </div>

          <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
              2. Manifest Schema
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Optional <code>labels.csv</code> for scoring accuracy & F1.
            </p>
          </div>

          <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
              3. Schema Results
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Download complete batch predictions as CSV or JSON.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-panel" style={{ padding: '20px', marginBottom: '20px' }}>
      {/* Header & Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px',
        paddingBottom: '14px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
              {batch.batch_name}
            </h3>
            <span className="status-tag tag-satisfied" style={{ fontSize: '11px' }}>
              <span className="status-dot" />
              <span>{batch.processed_files}/{batch.total_files} Processed</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
            <span>Duration: <strong style={{ color: 'var(--text-secondary)' }}>{batch.total_duration_seconds}s</strong></span>
            <span>•</span>
            <span>Batch Latency: <strong style={{ color: 'var(--text-secondary)' }}>{batch.total_processing_time_ms} ms</strong></span>
            <span>•</span>
            <span>Cost: <strong style={{ color: 'var(--status-success)' }}>${batch.cost_per_audio_minute_usd} / min</strong></span>
          </div>
        </div>

        {/* Download Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <a
            href={api.getExportCsvUrl(batch.batch_id)}
            download
            className="btn btn-primary btn-sm"
          >
            <Download size={13} />
            Export CSV (name, result_json)
          </a>

          <a
            href={api.getExportJsonUrl(batch.batch_id)}
            download
            className="btn btn-secondary btn-sm"
          >
            <FileCode size={13} />
            Export JSON
          </a>
        </div>
      </div>

      {/* Results Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Audio Filename</th>
              <th>Status</th>
              <th>Emotional Tone</th>
              <th>Intensity</th>
              <th>Noise</th>
              <th>Noise Type & Severity</th>
              <th>Audio Quality</th>
              <th>Overlap</th>
              <th>Silence</th>
              <th>Confidence</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {batch.items.map((item, idx) => {
              const res = item.result;
              const gt = item.ground_truth;
              const hasError = item.status === 'error';

              return (
                <tr key={idx}>
                  {/* Filename & Playback */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => {
                          const url = api.getAudioStreamUrl(batch.batch_id, item.filename);
                          setActiveAudio(activeAudio === url ? null : url);
                        }}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: 'var(--radius-xs)',
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-default)',
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        title="Play audio clip"
                      >
                        <Volume2 size={12} />
                      </button>
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {item.filename}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                          {item.audio_duration_s ? `${item.audio_duration_s}s • ${item.processing_time_ms}ms` : '0.0s'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    {hasError ? (
                      <span className="status-tag tag-upset" style={{ fontSize: '11px' }}>
                        <span className="status-dot" /> Error
                      </span>
                    ) : (
                      <span className="status-tag tag-satisfied" style={{ fontSize: '11px' }}>
                        <span className="status-dot" /> Valid
                      </span>
                    )}
                  </td>

                  {/* Emotional Tone */}
                  <td>
                    {res ? (
                      <div>
                        {renderToneTag(res.emotional_tone)}
                        {gt && (
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                            GT: {gt.emotional_tone}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>

                  {/* Emotional Intensity */}
                  <td>
                    {res ? (
                      <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)', fontSize: '12px' }}>
                        {res.emotional_intensity}
                      </span>
                    ) : '—'}
                  </td>

                  {/* Background Noise Present */}
                  <td>
                    {res ? (
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11.5px',
                        color: res.background_noise_present ? 'var(--status-warning)' : 'var(--text-muted)'
                      }}>
                        {res.background_noise_present ? 'true' : 'false'}
                      </span>
                    ) : '—'}
                  </td>

                  {/* Background Noise Type & Severity */}
                  <td>
                    {res && res.background_noise_present ? (
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                          "{res.background_noise_type}"
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                          sev: {res.background_noise_severity}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>none</span>
                    )}
                  </td>

                  {/* Audio Quality */}
                  <td>
                    {res ? (
                      <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        {res.audio_quality.replace('_', ' ')}
                      </span>
                    ) : '—'}
                  </td>

                  {/* Overlap */}
                  <td>
                    {res ? (
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11.5px',
                        color: res.speaker_overlap_present ? 'var(--status-danger)' : 'var(--text-muted)'
                      }}>
                        {res.speaker_overlap_present ? 'true' : 'false'}
                      </span>
                    ) : '—'}
                  </td>

                  {/* Long Silence */}
                  <td>
                    {res ? (
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11.5px',
                        color: res.long_silence_present ? 'var(--status-warning)' : 'var(--text-muted)'
                      }}>
                        {res.long_silence_present ? 'true' : 'false'}
                      </span>
                    ) : '—'}
                  </td>

                  {/* Confidence */}
                  <td>
                    {res ? (
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        color: res.confidence >= 0.80 ? 'var(--status-success)' : 'var(--status-warning)'
                      }}>
                        {res.confidence.toFixed(2)}
                      </span>
                    ) : '—'}
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'right' }}>
                    {res ? (
                      <button
                        onClick={() => setSelectedJsonItem(item)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                      >
                        <Eye size={12} /> JSON
                      </button>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--status-danger)' }}>{item.error || 'Failed'}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Audio Playback Bar */}
      {activeAudio && (
        <div style={{
          marginTop: '14px',
          background: 'var(--bg-subtle)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Playback:
          </span>
          <audio controls autoPlay src={activeAudio} style={{ flex: 1, height: '28px' }} />
        </div>
      )}

      {/* Structured JSON Modal */}
      {selectedJsonItem && (
        <div className="modal-overlay" onClick={() => setSelectedJsonItem(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '14px', fontFamily: 'var(--font-mono)' }}>
                {selectedJsonItem.filename}
              </h3>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => handleCopyJson(selectedJsonItem.result)}
                  className="btn btn-secondary btn-sm"
                >
                  {copied ? <Check size={13} color="var(--status-success)" /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={() => setSelectedJsonItem(null)}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '4px' }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <pre style={{
              background: 'var(--bg-canvas)',
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              fontSize: '12px',
              color: 'var(--text-primary)',
              overflowX: 'auto',
              lineHeight: 1.5
            }}>
              {JSON.stringify(selectedJsonItem.result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
