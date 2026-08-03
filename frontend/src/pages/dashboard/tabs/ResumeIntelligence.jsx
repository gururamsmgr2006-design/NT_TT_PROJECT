// src/pages/dashboard/tabs/ResumeIntelligence.jsx — Merged: Analyzer + Skill Gap + Roadmap
import { useState, useEffect, useRef } from 'react';
import { apiRequest, BACKEND_URL, getToken, AIService } from '../../../services/api.js';

const LANG_OPTIONS = [
  { code:'en', label:'English' }, { code:'hi', label:'Hindi' },
  { code:'ta', label:'Tamil'   }, { code:'kn', label:'Kannada' },
  { code:'te', label:'Telugu'  },
];
const TARGET_ROLES = ['Frontend Developer','Backend Developer','MERN Stack Developer','Full Stack Developer','React Developer','Node.js Developer','Java Developer','Python Developer','Data Analyst','Data Scientist','Machine Learning Engineer','AI Engineer','DevOps Engineer','Cloud Engineer','Android Developer','iOS Developer','UI/UX Designer','Product Manager','Business Analyst','Cybersecurity Analyst'];
const CAREER_OPTIONS = ['Frontend Developer','Backend Developer','Full Stack Developer','MERN Stack Developer','React Developer','Node.js Developer','Java Developer','Python Developer','Data Scientist','Machine Learning Engineer','AI/ML Engineer','Data Analyst','DevOps Engineer','Cloud Architect','Cybersecurity Engineer','Android Developer','iOS Developer','Flutter Developer','UI/UX Designer','Product Manager','Business Analyst','QA Engineer'];

function ScoreCircle({ score, label, color }) {
  const s = 2 * Math.PI * 34;
  return (
    <div className="score-circle-wrap">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${(score/100)*s} ${s}`} strokeLinecap="round" transform="rotate(-90 40 40)" />
        <text x="40" y="44" textAnchor="middle" fontSize="18" fontWeight="700" fill={color}>{score}</text>
      </svg>
      <div className="score-label">{label}</div>
    </div>
  );
}

const IMP_COLOR = { critical:'#ef4444', high:'#f59e0b', medium:'#6366f1', low:'#10b981' };
const PHASE_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

export default function ResumeIntelligence() {
  const [activeTab,  setActiveTab]  = useState('analyze');
  const [language,   setLanguage]   = useState('en');

  // ── Resume Analyzer state ─────────────────────────────────
  const [file,       setFile]       = useState(null);
  const [uploading,  setUploading]  = useState(false);
  const [analyzing,  setAnalyzing]  = useState(false);
  const [analysis,   setAnalysis]   = useState(null);
  const [history,    setHistory]    = useState([]);
  const [raError,    setRaError]    = useState('');
  const fileRef = useRef(null);

  // ── Skill Gap state ───────────────────────────────────────
  const [targetRole, setTargetRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [userSkills, setUserSkills] = useState([]);
  const [sgResult,   setSgResult]   = useState(null);
  const [sgHistory,  setSgHistory]  = useState([]);
  const [sgLoading,  setSgLoading]  = useState(false);
  const [sgError,    setSgError]    = useState('');

  // ── Roadmap state ─────────────────────────────────────────
  const [rmForm,     setRmForm]     = useState({ targetCareer:'', customCareer:'', currentSkills:'', education:'', experience:'Fresher (0 years)' });
  const [roadmap,    setRoadmap]    = useState(null);
  const [rmHistory,  setRmHistory]  = useState([]);
  const [rmLoading,  setRmLoading]  = useState(false);
  const [rmError,    setRmError]    = useState('');
  const [phExpanded, setPhExpanded] = useState({});

  useEffect(() => {
    AIService.getResumeHistory().then(r => setHistory(r.analyses||[])).catch(()=>{});
    AIService.getSkillGapHistory().then(r => setSgHistory(r.history||[])).catch(()=>{});
    AIService.getRoadmapHistory().then(r => setRmHistory(r.history||[])).catch(()=>{});
  }, []);

  // ── Resume handlers ───────────────────────────────────────
  const handleFile = e => {
    const f = e.target.files[0]; if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['pdf','doc','docx'].includes(ext)) { setRaError('Only PDF and DOCX supported.'); return; }
    if (f.size > 5*1024*1024) { setRaError('File must be under 5 MB.'); return; }
    setFile(f); setRaError(''); setAnalysis(null);
  };

  const handleAnalyze = async () => {
    if (!file) { setRaError('Please select a file.'); return; }
    setRaError(''); setUploading(true);
    let analysisId;
    try {
      const fd = new FormData(); fd.append('resume', file);
      const res = await fetch(`${BACKEND_URL}/api/resume/upload`, { method:'POST', headers:{ Authorization:`Bearer ${getToken()}` }, body:fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.message||'Upload failed');
      analysisId = data.analysisId;
    } catch (err) { setRaError(err.message); setUploading(false); return; }
    setUploading(false); setAnalyzing(true);
    try {
      const res = await AIService.analyzeResume({ analysisId, language });
      setAnalysis(res.analysis);
      AIService.getResumeHistory().then(r => setHistory(r.analyses||[]));
    } catch (err) { setRaError(err.message||'Analysis failed.'); }
    finally { setAnalyzing(false); }
  };

  // ── Skill Gap handlers ────────────────────────────────────
  const addSkill = () => { const s = skillInput.trim(); if (!s||userSkills.includes(s)) { setSkillInput(''); return; } setUserSkills(p=>[...p,s]); setSkillInput(''); };
  const analyzeSkillGap = async () => {
    const role = customRole||targetRole;
    if (!role) { setSgError('Select or enter a target role.'); return; }
    if (!userSkills.length) { setSgError('Add at least one skill.'); return; }
    setSgError(''); setSgLoading(true);
    try {
      const res = await AIService.analyzeSkillGap({ targetRole:role, userSkills, language });
      setSgResult(res.skillGap);
      AIService.getSkillGapHistory().then(r => setSgHistory(r.history||[]));
    } catch (err) { setSgError(err.message||'Analysis failed.'); }
    finally { setSgLoading(false); }
  };

  // ── Roadmap handlers ──────────────────────────────────────
  const generateRoadmap = async () => {
    const career = rmForm.customCareer||rmForm.targetCareer;
    if (!career) { setRmError('Select or enter a target career.'); return; }
    setRmError(''); setRmLoading(true);
    try {
      const res = await AIService.generateRoadmap({ targetCareer:career, currentSkills: rmForm.currentSkills.split(/[,\n]/).map(s=>s.trim()).filter(Boolean), education:rmForm.education||'Not specified', experience:rmForm.experience, language });
      setRoadmap(res.roadmap);
      AIService.getRoadmapHistory().then(r => setRmHistory(r.history||[]));
    } catch (err) { setRmError(err.message||'Failed to generate roadmap.'); }
    finally { setRmLoading(false); }
  };

  return (
    <div className="ri-container">
      <div className="ra-header"><h2><i className="fas fa-brain" /> Resume Intelligence</h2><p>AI-powered resume analysis, skill gap detection, career roadmap, and readiness scoring — all in one place.</p></div>

      <div className="ra-tabs">
        {[
          { key:'analyze',  label:'Resume Analyzer',  icon:'fa-file-alt'  },
          { key:'skillgap', label:'Skill Gap',         icon:'fa-chart-bar' },
          { key:'roadmap',  label:'Career Roadmap',    icon:'fa-road'      },
          { key:'history',  label:`History (${Math.max(history.length, sgHistory.length, rmHistory.length)})`, icon:'fa-history' },
        ].map(t => (
          <button key={t.key} className={`ra-tab${activeTab===t.key?' active':''}`} onClick={() => setActiveTab(t.key)}>
            <i className={`fas ${t.icon}`} /> {t.label}
          </button>
        ))}
        <select value={language} onChange={e => setLanguage(e.target.value)} className="ra-lang-select" style={{ marginLeft:'auto' }}>
          {LANG_OPTIONS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </div>

      {/* ── RESUME ANALYZER ── */}
      {activeTab === 'analyze' && (
        <div className="ra-content">
          {!analysis ? (
            <div className="ra-upload-panel">
              <div className={`ra-dropzone${file?' has-file':''}`} onClick={() => fileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f){setFile(f);setRaError('');}}}>
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFile} style={{ display:'none' }} />
                {file ? (<><i className="fas fa-file-check" style={{ fontSize:'2rem',color:'#10b981' }} /><p style={{ fontWeight:600,marginTop:'0.5rem' }}>{file.name}</p><p style={{ color:'#6b7280',fontSize:'0.85rem' }}>{(file.size/1024).toFixed(0)} KB</p><button className="ra-change-btn" onClick={e=>{e.stopPropagation();setFile(null);}}>Change File</button></>)
                : (<><i className="fas fa-cloud-upload-alt" style={{ fontSize:'2.5rem',color:'#6366f1' }} /><p style={{ fontWeight:600,marginTop:'0.5rem' }}>Drop your resume or click to browse</p><p style={{ color:'#6b7280',fontSize:'0.85rem' }}>PDF or DOCX · Max 5 MB</p></>)}
              </div>
              {raError && <div className="ra-error"><i className="fas fa-exclamation-circle" /> {raError}</div>}
              <button className="ra-analyze-btn" onClick={handleAnalyze} disabled={!file||uploading||analyzing}>
                {uploading?<><i className="fas fa-spinner fa-pulse" /> Uploading…</>:analyzing?<><i className="fas fa-spinner fa-pulse" /> Analysing with AI…</>:<><i className="fas fa-magic" /> Analyse Resume</>}
              </button>
            </div>
          ) : (
            <div className="ra-results">
              <div className="ra-results-header"><h3>Analysis: {analysis.fileName}</h3><button className="ra-new-btn" onClick={() => { setAnalysis(null); setFile(null); }}><i className="fas fa-plus" /> Analyse Another</button></div>
              <div className="ra-scores">
                <ScoreCircle score={analysis.overallScore||0}       label="Overall Score"   color="#6366f1" />
                <ScoreCircle score={analysis.atsScore||0}           label="ATS Score"       color="#10b981" />
                <ScoreCircle score={analysis.careerReadinessScore||0} label="Career Readiness" color="#f59e0b" />
              </div>
              <div className="ra-grid-2">
                <div className="ra-section"><h4><i className="fas fa-check-circle" style={{ color:'#10b981' }} /> Strengths</h4><ul>{(analysis.strengths||[]).map((s,i)=><li key={i}>{s}</li>)}</ul></div>
                <div className="ra-section"><h4><i className="fas fa-exclamation-circle" style={{ color:'#ef4444' }} /> Weaknesses</h4><ul>{(analysis.weaknesses||[]).map((w,i)=><li key={i}>{w}</li>)}</ul></div>
              </div>
              {analysis.extractedSkills?.length > 0 && (
                <div className="ra-section"><h4><i className="fas fa-code" style={{ color:'#06b6d4' }} /> Extracted Skills</h4>
                  <div className="tag-list">{analysis.extractedSkills.map((s,i)=><span key={i} className="analysis-tag" style={{ borderColor:'#06b6d4',color:'#06b6d4' }}>{s}</span>)}</div>
                </div>
              )}
              <div className="ra-section"><h4><i className="fas fa-tags" style={{ color:'#6366f1' }} /> Keyword Analysis</h4>
                <p style={{ fontSize:'0.8rem',color:'#6b7280',marginBottom:'0.4rem' }}>Found:</p>
                <div className="tag-list">{(analysis.keywordAnalysis?.found||[]).map((s,i)=><span key={i} className="analysis-tag" style={{ borderColor:'#10b981',color:'#10b981' }}>{s}</span>)}</div>
                <p style={{ fontSize:'0.8rem',color:'#6b7280',margin:'0.75rem 0 0.4rem' }}>Missing:</p>
                <div className="tag-list">{(analysis.keywordAnalysis?.missing||[]).map((s,i)=><span key={i} className="analysis-tag" style={{ borderColor:'#ef4444',color:'#ef4444' }}>{s}</span>)}</div>
              </div>
              {analysis.certificationSuggestions?.length > 0 && <div className="ra-section"><h4><i className="fas fa-certificate" style={{ color:'#f59e0b' }} /> Certification Suggestions</h4><ul>{analysis.certificationSuggestions.map((s,i)=><li key={i}>{s}</li>)}</ul></div>}
              {analysis.projectSuggestions?.length > 0 && <div className="ra-section"><h4><i className="fas fa-laptop-code" style={{ color:'#8b5cf6' }} /> Project Suggestions</h4><ul>{analysis.projectSuggestions.map((s,i)=><li key={i}>{s}</li>)}</ul></div>}
              {analysis.interviewPrepTopics?.length > 0 && <div className="ra-section"><h4><i className="fas fa-comments" style={{ color:'#6366f1' }} /> Interview Prep Topics</h4><ul>{analysis.interviewPrepTopics.map((s,i)=><li key={i}>{s}</li>)}</ul></div>}
              {analysis.formattingFeedback && <div className="ra-section"><h4><i className="fas fa-align-left" style={{ color:'#8b5cf6' }} /> Formatting Feedback</h4><p>{analysis.formattingFeedback}</p></div>}
              <div className="ra-section"><h4><i className="fas fa-lightbulb" style={{ color:'#f59e0b' }} /> Improvement Suggestions</h4><ol>{(analysis.improvementSuggestions||[]).map((s,i)=><li key={i}>{s}</li>)}</ol></div>
            </div>
          )}
        </div>
      )}

      {/* ── SKILL GAP ── */}
      {activeTab === 'skillgap' && (
        <div className="sg-content">
          {!sgResult ? (
            <div className="sg-form">
              <div className="sg-field"><label>Target Role</label>
                <select value={targetRole} onChange={e=>{setTargetRole(e.target.value);setCustomRole('');}}>
                  <option value="">— Select a role —</option>
                  {TARGET_ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                  <option value="custom">Other (type below)</option>
                </select>
                {(targetRole==='custom'||!TARGET_ROLES.includes(targetRole)) && <input type="text" placeholder="Type your target role..." value={customRole} onChange={e=>setCustomRole(e.target.value)} style={{ marginTop:'0.5rem' }} />}
              </div>
              <div className="sg-field"><label>Your Skills <span style={{ color:'#6b7280',fontWeight:400 }}>(Enter or comma)</span></label>
                <div className="sg-skill-input-wrap"><input type="text" placeholder="e.g. JavaScript, React..." value={skillInput} onChange={e=>setSkillInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'||e.key===','){e.preventDefault();addSkill();}}} /><button className="sg-add-btn" onClick={addSkill}>Add</button></div>
                {userSkills.length>0 && <div className="sg-skills-tags">{userSkills.map(s=><span key={s} className="sg-skill-tag">{s} <button onClick={()=>setUserSkills(p=>p.filter(x=>x!==s))}>×</button></span>)}</div>}
              </div>
              {sgError && <div className="ra-error"><i className="fas fa-exclamation-circle" /> {sgError}</div>}
              <button className="ra-analyze-btn" onClick={analyzeSkillGap} disabled={sgLoading}>{sgLoading?<><i className="fas fa-spinner fa-pulse" /> Analysing…</>:<><i className="fas fa-search" /> Detect Skill Gap</>}</button>
            </div>
          ) : (
            <div className="sg-results">
              <div className="sg-results-top"><div><h3>Skill Gap: {sgResult.targetRole}</h3><p style={{ color:'#6b7280' }}>{sgResult.summary}</p></div><button className="ra-new-btn" onClick={()=>setSgResult(null)}><i className="fas fa-plus" /> New</button></div>
              <div className="sg-match-bar-wrap"><div className="sg-match-label">Match: <strong>{sgResult.matchPercentage}%</strong></div><div className="sg-match-track"><div className="sg-match-fill" style={{ width:`${sgResult.matchPercentage}%`, background: sgResult.matchPercentage>=70?'#10b981':sgResult.matchPercentage>=40?'#f59e0b':'#ef4444' }} /></div></div>
              <div className="ra-grid-2">
                <div className="ra-section"><h4><i className="fas fa-check-circle" style={{ color:'#10b981' }} /> Skills You Have</h4><div className="tag-list">{(sgResult.presentSkills||[]).map((s,i)=><span key={i} className="analysis-tag" style={{ borderColor:'#10b981',color:'#10b981' }}>{s}</span>)}</div></div>
                <div className="ra-section"><h4><i className="fas fa-times-circle" style={{ color:'#ef4444' }} /> Missing Skills</h4>{(sgResult.missingSkills||[]).map((s,i)=><div key={i} className="sg-missing-skill"><div className="sg-missing-name"><span className="sg-importance-badge" style={{ background:IMP_COLOR[s.importance]+'20',color:IMP_COLOR[s.importance] }}>{s.importance}</span>{s.skill}</div>{s.estimatedHours&&<div style={{ fontSize:'0.78rem',color:'#6b7280' }}>~{s.estimatedHours}h</div>}</div>)}</div>
              </div>
              {sgResult.learningPath?.length>0 && <div className="ra-section"><h4><i className="fas fa-road" style={{ color:'#6366f1' }} /> Learning Path</h4><div className="sg-learning-path">{sgResult.learningPath.map((ph,i)=><div key={i} className="sg-phase"><div className="sg-phase-header"><span className="sg-phase-num">Phase {ph.phase}</span><strong>{ph.title}</strong><span className="sg-phase-duration">{ph.duration}</span></div><div className="sg-phase-skills">{(ph.skills||[]).map((s,si)=><span key={si} className="sg-phase-skill">{s}</span>)}</div></div>)}</div></div>}
            </div>
          )}
        </div>
      )}

      {/* ── ROADMAP ── */}
      {activeTab === 'roadmap' && (
        <div className="sg-content">
          {!roadmap ? (
            <div className="sg-form">
              <div className="rm-form-grid">
                <div className="sg-field"><label>Target Career</label>
                  <select value={rmForm.targetCareer} onChange={e=>{setRmForm(p=>({...p,targetCareer:e.target.value,customCareer:''}));}}>
                    <option value="">— Select a career —</option>
                    {CAREER_OPTIONS.map(c=><option key={c} value={c}>{c}</option>)}
                    <option value="custom">Other</option>
                  </select>
                  {(rmForm.targetCareer==='custom'||!CAREER_OPTIONS.includes(rmForm.targetCareer)) && <input type="text" placeholder="Type your career goal…" value={rmForm.customCareer} onChange={e=>setRmForm(p=>({...p,customCareer:e.target.value}))} style={{ marginTop:'0.5rem' }} />}
                </div>
                <div className="sg-field"><label>Experience Level</label>
                  <select value={rmForm.experience} onChange={e=>setRmForm(p=>({...p,experience:e.target.value}))}>
                    {['Fresher (0 years)','1-2 years','2-4 years','4-7 years','7+ years'].map(l=><option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="sg-field"><label>Education</label><input type="text" placeholder="e.g. B.Tech CSE, BCA" value={rmForm.education} onChange={e=>setRmForm(p=>({...p,education:e.target.value}))} /></div>
              </div>
              <div className="sg-field"><label>Current Skills</label><textarea rows={2} placeholder="e.g. HTML, CSS, JavaScript, Python…" value={rmForm.currentSkills} onChange={e=>setRmForm(p=>({...p,currentSkills:e.target.value}))} /></div>
              {rmError && <div className="ra-error"><i className="fas fa-exclamation-circle" /> {rmError}</div>}
              <button className="ra-analyze-btn" onClick={generateRoadmap} disabled={rmLoading}>{rmLoading?<><i className="fas fa-spinner fa-pulse" /> Generating…</>:<><i className="fas fa-road" /> Generate Roadmap</>}</button>
            </div>
          ) : (
            <div className="rm-results">
              <div className="sg-results-top"><div><h3>🎯 {roadmap.targetCareer}</h3><p style={{ color:'#6b7280' }}>{roadmap.summary}</p></div><button className="ra-new-btn" onClick={()=>setRoadmap(null)}><i className="fas fa-plus" /> New</button></div>
              <div className="rm-meta">
                {roadmap.totalDuration&&<div className="rm-meta-item"><i className="fas fa-clock" /> <strong>Duration:</strong> {roadmap.totalDuration}</div>}
                {roadmap.salaryRange&&<div className="rm-meta-item"><i className="fas fa-rupee-sign" /> <strong>Salary:</strong> {roadmap.salaryRange}</div>}
                {roadmap.jobOutlook&&<div className="rm-meta-item"><i className="fas fa-chart-line" /> <strong>Outlook:</strong> {roadmap.jobOutlook}</div>}
              </div>
              <div className="rm-phases">{(roadmap.phases||[]).map((ph,i)=>(
                <div key={i} className="rm-phase" style={{ borderLeft:`4px solid ${PHASE_COLORS[i%PHASE_COLORS.length]}` }}>
                  <div className="rm-phase-header" onClick={()=>setPhExpanded(p=>({...p,[i]:!p[i]}))}>
                    <div className="rm-phase-title"><span className="rm-phase-num" style={{ background:PHASE_COLORS[i%PHASE_COLORS.length] }}>{ph.phase}</span><div><strong>{ph.title}</strong><span className="rm-phase-dur">{ph.duration}</span></div></div>
                    <i className={`fas fa-chevron-${phExpanded[i]?'up':'down'}`} style={{ color:'#6b7280' }} />
                  </div>
                  {phExpanded[i] && <div className="rm-phase-body">
                    {ph.skills?.length>0&&<div className="rm-phase-section"><p className="rm-phase-section-title"><i className="fas fa-code" /> Skills</p><div className="tag-list">{ph.skills.map((s,si)=><span key={si} className="sg-phase-skill">{s}</span>)}</div></div>}
                    {ph.certifications?.length>0&&<div className="rm-phase-section"><p className="rm-phase-section-title"><i className="fas fa-certificate" /> Certifications</p><ul>{ph.certifications.map((c,ci)=><li key={ci}>{c}</li>)}</ul></div>}
                    {ph.projects?.length>0&&<div className="rm-phase-section"><p className="rm-phase-section-title"><i className="fas fa-laptop-code" /> Projects</p><ul>{ph.projects.map((p,pi)=><li key={pi}>{p}</li>)}</ul></div>}
                    {ph.resources?.length>0&&<div className="rm-phase-section"><p className="rm-phase-section-title"><i className="fas fa-book" /> Resources</p><ul>{ph.resources.map((r,ri)=><li key={ri}>{r}</li>)}</ul></div>}
                    {ph.milestones?.length>0&&<div className="rm-phase-section"><p className="rm-phase-section-title"><i className="fas fa-flag-checkered" /> Milestones</p><ul>{ph.milestones.map((m,mi)=><li key={mi}>{m}</li>)}</ul></div>}
                  </div>}
                </div>
              ))}</div>
              {roadmap.interviewPrep?.length>0&&<div className="ra-section"><h4><i className="fas fa-comments" style={{ color:'#6366f1' }} /> Interview Prep</h4><ul>{roadmap.interviewPrep.map((t,i)=><li key={i}>{t}</li>)}</ul></div>}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY ── */}
      {activeTab === 'history' && (
        <div className="ra-history">
          <h4 style={{ marginBottom:'1rem' }}><i className="fas fa-file-alt" style={{ color:'#6366f1' }} /> Resume Analyses</h4>
          {history.length===0 ? <p style={{ color:'#9ca3af', marginBottom:'1.5rem' }}>No analyses yet.</p>
          : history.map(item=>(
            <div key={item._id} className="ra-history-card" onClick={()=>{ setAnalysis(item); setActiveTab('analyze'); }}>
              <div className="ra-history-info"><strong>{item.fileName}</strong><span>{new Date(item.createdAt).toLocaleDateString()}</span></div>
              <div className="ra-history-scores">
                <span className="score-badge" style={{ background:'#6366f120',color:'#6366f1' }}>Overall: {item.overallScore}</span>
                <span className="score-badge" style={{ background:'#10b98120',color:'#10b981' }}>ATS: {item.atsScore}</span>
              </div>
              <button className="ra-view-btn"><i className="fas fa-eye" /> View</button>
            </div>
          ))}
          <h4 style={{ margin:'1.5rem 0 1rem' }}><i className="fas fa-chart-bar" style={{ color:'#6366f1' }} /> Skill Gap Analyses</h4>
          {sgHistory.length===0 ? <p style={{ color:'#9ca3af', marginBottom:'1.5rem' }}>No analyses yet.</p>
          : sgHistory.map(item=>(
            <div key={item._id} className="ra-history-card" onClick={()=>{ setSgResult(item); setActiveTab('skillgap'); }}>
              <div className="ra-history-info"><strong>{item.targetRole}</strong><span>{new Date(item.createdAt).toLocaleDateString()}</span></div>
              <div className="ra-history-scores"><span className="score-badge" style={{ background:'#6366f120',color:'#6366f1' }}>Match: {item.matchPercentage}%</span></div>
              <button className="ra-view-btn"><i className="fas fa-eye" /> View</button>
            </div>
          ))}
          <h4 style={{ margin:'1.5rem 0 1rem' }}><i className="fas fa-road" style={{ color:'#6366f1' }} /> Career Roadmaps</h4>
          {rmHistory.length===0 ? <p style={{ color:'#9ca3af' }}>No roadmaps yet.</p>
          : rmHistory.map(item=>(
            <div key={item._id} className="ra-history-card" onClick={()=>{ setRoadmap(item); setActiveTab('roadmap'); }}>
              <div className="ra-history-info"><strong>{item.targetCareer}</strong><span>{new Date(item.createdAt).toLocaleDateString()}</span></div>
              <div className="ra-history-scores"><span className="score-badge" style={{ background:'#6366f120',color:'#6366f1' }}>{item.phases?.length||0} phases</span></div>
              <button className="ra-view-btn"><i className="fas fa-eye" /> View</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
