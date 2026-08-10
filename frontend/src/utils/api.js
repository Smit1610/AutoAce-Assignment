/**
 * AutoAce AI Client API Service
 */

const API_BASE = '/api';

export const api = {
  // Authentication
  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Authentication failed' }));
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  },

  // Batch ZIP Upload
  async uploadBatchZip(file, batchName) {
    const formData = new FormData();
    formData.append('file', file);
    if (batchName) formData.append('batch_name', batchName);

    const res = await fetch(`${API_BASE}/batch/upload-zip`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'ZIP upload failed' }));
      throw new Error(err.detail || 'ZIP processing failed');
    }
    return res.json();
  },

  // Batch Multi-File Upload
  async uploadBatchFiles(audioFiles, manifestFile, batchName) {
    const formData = new FormData();
    for (const f of audioFiles) {
      formData.append('files', f);
    }
    if (manifestFile) {
      formData.append('manifest', manifestFile);
    }
    if (batchName) {
      formData.append('batch_name', batchName);
    }

    const res = await fetch(`${API_BASE}/batch/upload-files`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Batch upload failed' }));
      throw new Error(err.detail || 'Batch files processing failed');
    }
    return res.json();
  },

  // Single Audio Analysis
  async analyzeSingleAudio(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/analyze/single`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Single analysis failed' }));
      throw new Error(err.detail || 'Audio analysis failed');
    }
    return res.json();
  },

  // Reference Call Analysis (call_001, call_002, call_003)
  async analyzeReferenceCall(callId) {
    const res = await fetch(`${API_BASE}/analyze/reference/${callId}`);
    if (!res.ok) throw new Error('Failed to analyze reference call');
    return res.json();
  },

  // Reference Benchmark Metrics
  async getReferenceBenchmarkMetrics() {
    const res = await fetch(`${API_BASE}/evaluation/reference-benchmark`);
    if (!res.ok) throw new Error('Failed to fetch evaluation metrics');
    return res.json();
  },

  // Cost & Latency Benchmarks
  async getCostModel() {
    const res = await fetch(`${API_BASE}/benchmarks/cost-model`);
    if (!res.ok) throw new Error('Failed to fetch cost model');
    return res.json();
  },

  async getLatencyProfile() {
    const res = await fetch(`${API_BASE}/benchmarks/latency-profile`);
    if (!res.ok) throw new Error('Failed to fetch latency profile');
    return res.json();
  },

  // Technical Memo
  async getTechnicalMemo() {
    const res = await fetch(`${API_BASE}/memo/full-text`);
    if (!res.ok) throw new Error('Failed to fetch technical memo');
    return res.json();
  },

  // Audio stream URL helper
  getAudioStreamUrl(batchId, filename) {
    return `${API_BASE}/batch/${batchId}/audio/${encodeURIComponent(filename)}`;
  },

  getExportCsvUrl(batchId) {
    return `${API_BASE}/batch/${batchId}/export/csv`;
  },

  getExportJsonUrl(batchId) {
    return `${API_BASE}/batch/${batchId}/export/json`;
  }
};
