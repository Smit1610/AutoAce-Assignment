import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileAudio, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  Play, 
  Trash2, 
  Check, 
  Layers
} from 'lucide-react';
import { api } from '../utils/api';

export default function BatchUpload({ onBatchProcessed }) {
  const [selectedAudioFiles, setSelectedAudioFiles] = useState([]);
  const [selectedManifestFile, setSelectedManifestFile] = useState(null);
  const [manifestPreview, setManifestPreview] = useState(null);

  const [audioDragActive, setAudioDragActive] = useState(false);
  const [csvDragActive, setCsvDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [validationReport, setValidationReport] = useState(null);

  const audioInputRef = useRef(null);
  const csvInputRef = useRef(null);

  const handleAudioSelection = (files) => {
    setError(null);
    const audioList = Array.from(files).filter(f => 
      /\.(wav|mp3|ogg|flac|m4a|zip)$/i.test(f.name)
    );
    if (audioList.length === 0) {
      setError('Please select valid audio files (.wav, .mp3, .flac, .ogg, .m4a) or a .zip archive.');
      return;
    }
    setSelectedAudioFiles(audioList);
  };

  const handleCsvSelection = (files) => {
    setError(null);
    const csvFile = Array.from(files).find(f => f.name.toLowerCase().endsWith('.csv'));
    if (!csvFile) {
      setError('Please select a valid CSV manifest file (.csv).');
      return;
    }
    setSelectedManifestFile(csvFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      const rowCount = Math.max(0, lines.length - 1);
      const hasLabels = text.toLowerCase().includes('result_json') || text.toLowerCase().includes('emotional_tone');
      setManifestPreview({
        filename: csvFile.name,
        rows: rowCount,
        hasLabels: hasLabels
      });
    };
    reader.readAsText(csvFile);
  };

  const runBatchAnalysis = async () => {
    if (selectedAudioFiles.length === 0) {
      setError('Please upload at least one audio file or ZIP archive before running analysis.');
      return;
    }

    setError(null);
    setValidationReport(null);
    setUploading(true);
    setProgress(25);

    try {
      let result;
      const zipFile = selectedAudioFiles.find(f => f.name.toLowerCase().endsWith('.zip'));

      if (zipFile && selectedAudioFiles.length === 1 && !selectedManifestFile) {
        setProgress(50);
        result = await api.uploadBatchZip(zipFile);
      } else {
        setProgress(50);
        result = await api.uploadBatchFiles(selectedAudioFiles, selectedManifestFile);
      }

      setProgress(100);
      setValidationReport(result.validation_report);
      onBatchProcessed(result);
    } catch (err) {
      setError(err.message || 'Batch analysis execution failed');
    } finally {
      setUploading(false);
    }
  };

  const clearAudio = () => {
    setSelectedAudioFiles([]);
    if (audioInputRef.current) audioInputRef.current.value = '';
  };

  const clearCsv = () => {
    setSelectedManifestFile(null);
    setManifestPreview(null);
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

  return (
    <div className="surface-panel" style={{ padding: '20px', marginBottom: '20px' }}>
      {/* Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="var(--accent-primary)" />
            Batch Audio Evaluation
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', marginTop: '2px' }}>
            Upload raw call audio files and manifest for batch inference and ground-truth validation.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{
          background: 'var(--status-danger-bg)',
          border: '1px solid var(--status-danger-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          color: '#fb7185',
          fontSize: '12.5px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Two Upload Columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px',
        marginBottom: '16px'
      }}>
        {/* Section 1: Audio Files */}
        <div
          className={`upload-dropzone ${audioDragActive ? 'active' : ''}`}
          onDragEnter={(e) => { e.preventDefault(); setAudioDragActive(true); }}
          onDragOver={(e) => { e.preventDefault(); setAudioDragActive(true); }}
          onDragLeave={() => setAudioDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setAudioDragActive(false);
            if (e.dataTransfer.files) handleAudioSelection(e.dataTransfer.files);
          }}
        >
          <input
            ref={audioInputRef}
            type="file"
            multiple
            accept=".wav,.mp3,.ogg,.flac,.m4a,.zip"
            onChange={(e) => { if (e.target.files) handleAudioSelection(e.target.files); }}
            style={{ display: 'none' }}
          />

          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface-raised)',
            border: '1px solid var(--border-default)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px',
            color: selectedAudioFiles.length > 0 ? 'var(--status-success)' : 'var(--text-secondary)'
          }}>
            <FileAudio size={18} />
          </div>

          <h3 style={{ fontSize: '13.5px', fontWeight: 600, marginBottom: '2px' }}>
            1. Audio Clips or ZIP Archive
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '11.5px', marginBottom: '12px' }}>
            WAV, MP3, FLAC, OGG, or a ZIP archive
          </p>

          {selectedAudioFiles.length > 0 ? (
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Check size={13} /> {selectedAudioFiles.length} file(s) selected
                </span>
                <button
                  type="button"
                  onClick={clearAudio}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}
                >
                  <Trash2 size={11} /> Clear
                </button>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', maxHeight: '40px', overflowY: 'auto' }}>
                {selectedAudioFiles.slice(0, 3).map((f, i) => (
                  <span key={i} style={{ display: 'inline-block', background: 'var(--bg-surface-raised)', padding: '1px 5px', borderRadius: '3px', margin: '2px 4px 2px 0', fontFamily: 'var(--font-mono)' }}>
                    {f.name}
                  </span>
                ))}
                {selectedAudioFiles.length > 3 && <span>+{selectedAudioFiles.length - 3} more</span>}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => audioInputRef.current?.click()}
              className="btn btn-secondary btn-sm"
            >
              <Upload size={13} /> Browse Audio Files
            </button>
          )}
        </div>

        {/* Section 2: CSV Manifest */}
        <div
          className={`upload-dropzone ${csvDragActive ? 'active' : ''}`}
          onDragEnter={(e) => { e.preventDefault(); setCsvDragActive(true); }}
          onDragOver={(e) => { e.preventDefault(); setCsvDragActive(true); }}
          onDragLeave={() => setCsvDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setCsvDragActive(false);
            if (e.dataTransfer.files) handleCsvSelection(e.dataTransfer.files);
          }}
        >
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => { if (e.target.files) handleCsvSelection(e.target.files); }}
            style={{ display: 'none' }}
          />

          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface-raised)',
            border: '1px solid var(--border-default)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px',
            color: selectedManifestFile ? 'var(--status-success)' : 'var(--text-secondary)'
          }}>
            <FileSpreadsheet size={18} />
          </div>

          <h3 style={{ fontSize: '13.5px', fontWeight: 600, marginBottom: '2px' }}>
            2. Manifest File (labels.csv)
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '11.5px', marginBottom: '12px' }}>
            Columns: <code>name, result_json</code> (Optional)
          </p>

          {selectedManifestFile && manifestPreview ? (
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Check size={13} /> {manifestPreview.filename}
                </span>
                <button
                  type="button"
                  onClick={clearCsv}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}
                >
                  <Trash2 size={11} /> Clear
                </button>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                {manifestPreview.rows} rows detected • {manifestPreview.hasLabels ? 'Ground-truth included' : 'Unlabeled'}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => csvInputRef.current?.click()}
              className="btn btn-secondary btn-sm"
            >
              <FileSpreadsheet size={13} /> Browse labels.csv
            </button>
          )}
        </div>
      </div>

      {/* Execution Control Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'var(--bg-subtle)',
        padding: '12px 16px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          <span>Input Status: </span>
          <span style={{ color: selectedAudioFiles.length > 0 ? 'var(--text-primary)' : 'var(--text-disabled)', fontWeight: 500 }}>
            {selectedAudioFiles.length > 0 ? `${selectedAudioFiles.length} audio file(s) ready` : 'No audio loaded'}
          </span>
          {selectedManifestFile && <span style={{ color: 'var(--accent-primary)' }}> • Manifest attached</span>}
        </div>

        <button
          type="button"
          onClick={runBatchAnalysis}
          disabled={uploading || selectedAudioFiles.length === 0}
          className="btn btn-primary"
          style={{ padding: '7px 18px' }}
        >
          {uploading ? (
            <>
              <span className="spin-icon">⚙</span>
              Analyzing Audio...
            </>
          ) : (
            <>
              <Play size={13} />
              Run Batch Inference
            </>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      {uploading && (
        <div style={{ marginTop: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Processing audio frames...</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{progress}%</span>
          </div>
          <div style={{
            height: '4px',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-xs)',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'var(--accent-primary)',
              transition: 'width 0.2s ease'
            }} />
          </div>
        </div>
      )}

      {/* Validation Summary */}
      {validationReport && (
        <div style={{
          marginTop: '16px',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <CheckCircle2 size={14} color="var(--status-success)" />
            <h4 style={{ fontSize: '12.5px', fontWeight: 600 }}>Manifest Validation</h4>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '10px',
            fontSize: '12px'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Audio Discovered:</span>
              <strong style={{ display: 'block', color: 'var(--text-primary)' }}>
                {validationReport.total_audio_files_found} files
              </strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Manifest Rows:</span>
              <strong style={{ display: 'block', color: 'var(--text-primary)' }}>
                {validationReport.total_manifest_rows} rows
              </strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Matched Files:</span>
              <strong style={{ display: 'block', color: 'var(--status-success)' }}>
                {validationReport.matched_files_count}
              </strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Evaluation Mode:</span>
              <strong style={{ display: 'block', color: validationReport.has_labels ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                {validationReport.has_labels ? 'Scored (Ground Truth)' : 'Unlabeled'}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
