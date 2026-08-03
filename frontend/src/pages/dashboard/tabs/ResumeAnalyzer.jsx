// src/pages/dashboard/tabs/ResumeAnalyzer.jsx — Phase 4

import { useState, useEffect, useRef } from 'react';
import { apiRequest, BACKEND_URL, getToken } from '../../../services/api.js';

const LANG_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ta', label: 'Tamil' },
  { code: 'kn', label: 'Kannada' },
  { code: 'te', label: 'Telugu' },
];

function ScoreCircle({ score, label, color }) {
  return (
    <div className="score-circle-wrap">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${(score / 100) * 213.6} 213.6`}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
        />
        <text x="40" y="44" textAnchor="middle" fontSize="18" fontWeight="700" fill={color}>{score}</text>
      </svg>
      <div className="score-label">{label}</div>
    </div>
  );
}

function TagList({ items, color }) {
  return (
    <div className="tag-list">
      {(items || []).map((item, i) => (
        <span key={i} className="analysis-tag" style={{ borderColor: color, color }}>{item}</span>
      ))}
    </div>
  );
}

export default function ResumeAnalyzer() {
  const [file,        setFile]        = useState(null);
  const [language,    setLanguage]    = useState('en');
  const [uploading,   setUploading]   = useState(false);
  const [analyzing,   setAnalyzing]   = useState(false);
  const [analysis,    setAnalysis]    = useState(null);
  const [history,     setHistory]     = useState([]);
  const [error,       setError]       = useState('');
  const [tab,         setTab]         = useState('analyze'); // analyze | history
  const fileRef = useRef(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await apiRequest('/api/ai/resume/history');
      setHistory(res.analyses || []);
    } catch {}
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext)) {
      setError('Only PDF and DOCX files are supported.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('File size must be under 5 MB.');
      return;
    }
    setFile(f);
    setError('');
    setAnalysis(null);
  };

  const handleAnalyze = async () => {
    if (!file) { setError('Please select a file.'); return; }
    setError('');

    // Step 1: Upload
    setUploading(true);
    let analysisId;
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await fetch(`${BACKEND_URL}/api/resume/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Upload failed');
      analysisId = data.analysisId;
    } catch (err) {
      setError(err.message);
      setUploading(false);
      return;
    }
    setUploading(false);

    // Step 2: Analyze
    setAnalyzing(true);
    try {
      const res = await apiRequest('/api/ai/resume/analyze', {
        method: 'POST',
        body: JSON.stringify({ analysisId, language }),
      });
      setAnalysis(res.analysis);
      setTab('analyze');
      loadHistory();
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const loadHistoryItem = (item) => {
    setAnalysis(item);
    setTab('analyze');
  };

  return (
    <div className="ra-container">
      <div className="ra-header">
        <h2><i className="fas fa-file-alt" /> Resume Analyzer</h2>
        <p>Upload your resume for AI-powered ATS scoring, keyword analysis, and improvement suggestions.</p>
      </div>

      <div className="ra-tabs">
        <button className={`ra-tab${tab === 'analyze' ? ' active' : ''}`} onClick={() => setTab('analyze')}>
          <i className="fas fa-search" /> Analyze
        </button>
        <button className={`ra-tab${tab === 'history' ? ' active' : ''}`} onClick={() => setTab('history')}>
          <i className="fas fa-history" /> History ({history.length})
        </button>
      </div>

      {tab === 'analyze' && (
        <div className="ra-content">
          {/* Upload panel */}
          {!analysis && (
            <div className="ra-upload-panel">
              <div
                className={`ra-dropzone${file ? ' has-file' : ''}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setFile(f); setError(''); } }}
              >
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFile} style={{ display: 'none' }} />
                {file ? (
                  <>
                    <i className="fas fa-file-check" style={{ fontSize: '2rem', color: '#10b981' }} />
                    <p style={{ fontWeight: 600, marginTop: '0.5rem' }}>{file.name}</p>
                    <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>{(file.size / 1024).toFixed(0)} KB</p>
                    <button className="ra-change-btn" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                      Change File
                    </button>
                  </>
                ) : (
                  <>
                    <i className="fas fa-cloud-upload-alt" style={{ fontSize: '2.5rem', color: '#6366f1' }} />
                    <p style={{ fontWeight: 600, marginTop: '0.5rem' }}>Drop your resume here or click to browse</p>
                    <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>PDF or DOCX · Max 5 MB</p>
                  </>
                )}
              </div>

              <div className="ra-options">
                <label>Response Language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="ra-lang-select">
                  {LANG_OPTIONS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>

              {error && <div className="ra-error"><i className="fas fa-exclamation-circle" /> {error}</div>}

              <button
                className="ra-analyze-btn"
                onClick={handleAnalyze}
                disabled={!file || uploading || analyzing}
              >
                {uploading ? <><i className="fas fa-spinner fa-pulse" /> Uploading…</>
                  : analyzing ? <><i className="fas fa-spinner fa-pulse" /> Analyzing with AI…</>
                  : <><i className="fas fa-magic" /> Analyze Resume</>}
              </button>
            </div>
          )}

          {/* Results */}
          {analysis && (
            <div className="ra-results">
              <div className="ra-results-header">
                <h3>Analysis: {analysis.fileName}</h3>
                <button className="ra-new-btn" onClick={() => { setAnalysis(null); setFile(null); }}>
                  <i className="fas fa-plus" /> Analyze Another
                </button>
              </div>

              {/* Scores */}
              <div className="ra-scores">
                <ScoreCircle score={analysis.overallScore || 0}  label="Overall Score" color="#6366f1" />
                <ScoreCircle score={analysis.atsScore     || 0}  label="ATS Score"     color="#10b981" />
              </div>

              {/* Strengths & Weaknesses */}
              <div className="ra-grid-2">
                <div className="ra-section">
                  <h4><i className="fas fa-check-circle" style={{ color: '#10b981' }} /> Strengths</h4>
                  <ul>{(analysis.strengths || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
                <div className="ra-section">
                  <h4><i className="fas fa-exclamation-circle" style={{ color: '#ef4444' }} /> Weaknesses</h4>
                  <ul>{(analysis.weaknesses || []).map((w, i) => <li key={i}>{w}</li>)}</ul>
                </div>
              </div>

              {/* Keywords */}
              <div className="ra-section">
                <h4><i className="fas fa-tags" style={{ color: '#6366f1' }} /> Keyword Analysis</h4>
                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.4rem' }}>Found Keywords:</p>
                  <TagList items={analysis.keywordAnalysis?.found} color="#10b981" />
                </div>
                <div>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.4rem' }}>Missing Keywords:</p>
                  <TagList items={analysis.keywordAnalysis?.missing} color="#ef4444" />
                </div>
              </div>

              {/* Missing Skills */}
              {analysis.missingSkills?.length > 0 && (
                <div className="ra-section">
                  <h4><i className="fas fa-tools" style={{ color: '#f59e0b' }} /> Missing Skills</h4>
                  <TagList items={analysis.missingSkills} color="#f59e0b" />
                </div>
              )}

              {/* Formatting Feedback */}
              {analysis.formattingFeedback && (
                <div className="ra-section">
                  <h4><i className="fas fa-align-left" style={{ color: '#8b5cf6' }} /> Formatting Feedback</h4>
                  <p>{analysis.formattingFeedback}</p>
                </div>
              )}

              {/* Improvement Suggestions */}
              <div className="ra-section">
                <h4><i className="fas fa-lightbulb" style={{ color: '#f59e0b' }} /> Improvement Suggestions</h4>
                <ol>{(analysis.improvementSuggestions || []).map((s, i) => <li key={i}>{s}</li>)}</ol>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="ra-history">
          {history.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-file-alt" />
              <p>No analyses yet. Upload your resume to get started.</p>
            </div>
          ) : history.map((item) => (
            <div key={item._id} className="ra-history-card" onClick={() => loadHistoryItem(item)}>
              <div className="ra-history-info">
                <strong>{item.fileName}</strong>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="ra-history-scores">
                <span className="score-badge" style={{ background: '#6366f120', color: '#6366f1' }}>
                  Overall: {item.overallScore}
                </span>
                <span className="score-badge" style={{ background: '#10b98120', color: '#10b981' }}>
                  ATS: {item.atsScore}
                </span>
              </div>
              <button className="ra-view-btn"><i className="fas fa-eye" /> View</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
