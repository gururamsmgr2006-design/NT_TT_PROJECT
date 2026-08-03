// src/pages/dashboard/tabs/ProfilePage.jsx — Full Career Identity Center
import { useState, useEffect } from 'react';
import { ProfileService } from '../../../services/api.js';
import { useAuth } from '../../../context/AuthContext.jsx';

const SKILL_LEVELS = ['beginner','intermediate','advanced','expert'];
const WORK_PREFS   = ['remote','hybrid','onsite','flexible'];

function Section({ title, icon, color, children, collapsible = false }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="prf-section">
      <div className="prf-section-header" onClick={() => collapsible && setOpen(p => !p)} style={{ cursor: collapsible ? 'pointer' : 'default' }}>
        <h3><i className={`fas ${icon}`} style={{ color }} /> {title}</h3>
        {collapsible && <i className={`fas fa-chevron-${open?'up':'down'}`} style={{ color:'#6b7280' }} />}
      </div>
      {open && <div className="prf-section-body">{children}</div>}
    </div>
  );
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile]   = useState(null);
  const [saving,  setSaving]    = useState(false);
  const [saved,   setSaved]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState('');
  const [newSkill,setNewSkill]  = useState({ name:'', level:'intermediate', yearsUsed:0 });
  const [newEdu,  setNewEdu]    = useState({ degree:'', institution:'', field:'', year:'', grade:'' });
  const [newExp,  setNewExp]    = useState({ title:'', company:'', location:'', from:'', to:'', current:false, description:'' });
  const [newCert, setNewCert]   = useState({ name:'', issuer:'', year:'', url:'' });
  const [newProj, setNewProj]   = useState({ name:'', description:'', techStack:'', url:'', github:'' });

  useEffect(() => {
    ProfileService.getFull()
      .then(res => setProfile(res.profile || {}))
      .catch(() => setProfile({}))
      .finally(() => setLoading(false));
  }, []);

  const upd = (key, val) => setProfile(p => ({ ...p, [key]: val }));
  const updNested = (section, key, val) => setProfile(p => ({ ...p, [section]: { ...(p[section]||{}), [key]: val } }));

  const save = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await ProfileService.updateFull({
        ...profile,
        fullName: user?.fullName,
      });
      setProfile(res.profile);
      setSaved(true);
      await refreshUser();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { setError(err.message || 'Save failed. Please try again.'); }
    finally { setSaving(false); }
  };

  const addSkill = () => {
    if (!newSkill.name.trim()) return;
    upd('skills', [...(profile.skills||[]), { ...newSkill }]);
    setNewSkill({ name:'', level:'intermediate', yearsUsed:0 });
  };
  const removeSkill = i => upd('skills', profile.skills.filter((_,idx)=>idx!==i));

  const addEdu = () => { if (!newEdu.degree.trim()) return; upd('education', [...(profile.education||[]), { ...newEdu }]); setNewEdu({ degree:'', institution:'', field:'', year:'', grade:'' }); };
  const removeEdu = i => upd('education', profile.education.filter((_,idx)=>idx!==i));

  const addExp = () => { if (!newExp.title.trim()) return; upd('experience', [...(profile.experience||[]), { ...newExp }]); setNewExp({ title:'', company:'', location:'', from:'', to:'', current:false, description:'' }); };
  const removeExp = i => upd('experience', profile.experience.filter((_,idx)=>idx!==i));

  const addCert = () => { if (!newCert.name.trim()) return; upd('certifications', [...(profile.certifications||[]), { ...newCert }]); setNewCert({ name:'', issuer:'', year:'', url:'' }); };
  const removeCert = i => upd('certifications', profile.certifications.filter((_,idx)=>idx!==i));

  const addProj = () => { if (!newProj.name.trim()) return; upd('projects', [...(profile.projects||[]), { ...newProj, techStack: newProj.techStack.split(',').map(s=>s.trim()).filter(Boolean) }]); setNewProj({ name:'', description:'', techStack:'', url:'', github:'' }); };
  const removeProj = i => upd('projects', profile.projects.filter((_,idx)=>idx!==i));

  if (loading) return <div className="cdt-loading"><i className="fas fa-spinner fa-pulse" /> Loading profile…</div>;

  const completeness = profile.completenessScore || 0;

  return (
    <div className="prf-container">
      <div className="prf-top">
        <div>
          <h2><i className="fas fa-id-card" /> Career Identity Center</h2>
          <p>Your complete career profile — the foundation for all AI features.</p>
        </div>
        <div className="prf-completeness">
          <div className="prf-comp-label">Profile {completeness}% Complete</div>
          <div className="prf-comp-bar"><div style={{ width:`${completeness}%`, background: completeness>=80?'#10b981':'#6366f1', height:'100%', borderRadius:4 }} /></div>
        </div>
      </div>

      {saved  && <div className="prf-success"><i className="fas fa-check-circle" /> Profile saved successfully!</div>}
      {error  && <div className="ra-error"><i className="fas fa-exclamation-circle" /> {error}</div>}

      {/* Personal Info */}
      <Section title="Personal Information" icon="fa-user" color="#6366f1">
        <div className="prf-form-grid">
          {[
            { label:'Headline', key:'headline', placeholder:'e.g. Full-Stack Developer | MERN | AI Enthusiast' },
            { label:'Current Role', key:'currentRole', placeholder:'e.g. Software Engineer' },
            { label:'Current Company', key:'currentCompany', placeholder:'e.g. TCS, Infosys, Startup' },
            { label:'Years of Experience', key:'yearsExperience', type:'number', placeholder:'0' },
          ].map(f => (
            <div key={f.key} className="prf-field">
              <label>{f.label}</label>
              <input type={f.type||'text'} placeholder={f.placeholder} value={profile[f.key]||''} onChange={e => upd(f.key, f.type==='number' ? parseInt(e.target.value)||0 : e.target.value)} />
            </div>
          ))}
        </div>
        <div className="prf-field">
          <label>Professional Summary</label>
          <textarea rows={3} placeholder="Write a 2-3 sentence career summary..." value={profile.summary||''} onChange={e => upd('summary', e.target.value)} />
        </div>
        <div className="prf-field">
          <label>Interests (comma-separated)</label>
          <input type="text" placeholder="e.g. AI, Open Source, FinTech, Startups" value={(profile.interests||[]).join(', ')} onChange={e => upd('interests', e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} />
        </div>
      </Section>

      {/* Skills */}
      <Section title="Skills Inventory" icon="fa-code" color="#10b981">
        <div className="prf-skills-list">
          {(profile.skills||[]).map((s,i) => (
            <div key={i} className="prf-skill-tag">
              <span>{s.name}</span>
              <span className="prf-skill-level">{s.level}</span>
              <button onClick={() => removeSkill(i)} className="prf-remove-btn">×</button>
            </div>
          ))}
        </div>
        <div className="prf-add-row">
          <input type="text" placeholder="Skill name" value={newSkill.name} onChange={e => setNewSkill(p=>({...p,name:e.target.value}))} onKeyDown={e => e.key==='Enter' && addSkill()} />
          <select value={newSkill.level} onChange={e => setNewSkill(p=>({...p,level:e.target.value}))}>
            {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <input type="number" placeholder="Years" value={newSkill.yearsUsed} onChange={e => setNewSkill(p=>({...p,yearsUsed:parseInt(e.target.value)||0}))} style={{ width:70 }} />
          <button className="prf-add-btn" onClick={addSkill}><i className="fas fa-plus" /> Add</button>
        </div>
      </Section>

      {/* Education */}
      <Section title="Education" icon="fa-graduation-cap" color="#8b5cf6">
        {(profile.education||[]).map((e,i) => (
          <div key={i} className="prf-item-card">
            <div className="prf-item-info"><strong>{e.degree}</strong> — {e.institution} ({e.year}) {e.field && `| ${e.field}`} {e.grade && `| ${e.grade}`}</div>
            <button onClick={() => removeEdu(i)} className="prf-remove-btn">×</button>
          </div>
        ))}
        <div className="prf-add-grid">
          {[['degree','Degree/Program','e.g. B.Tech CSE'],['institution','Institution','e.g. GCE Tirunelveli'],['field','Field','e.g. Electrical and Electronics'],['year','Year','2027'],['grade','Grade/CGPA','e.g. 8.0 CGPA']].map(([k,l,p]) => (
            <div key={k} className="prf-field"><label>{l}</label><input type="text" placeholder={p} value={newEdu[k]} onChange={e=>setNewEdu(p=>({...p,[k]:e.target.value}))} /></div>
          ))}
          <div className="prf-field" style={{ display:'flex', alignItems:'flex-end' }}>
            <button className="prf-add-btn" onClick={addEdu}><i className="fas fa-plus" /> Add Education</button>
          </div>
        </div>
      </Section>

      {/* Experience */}
      <Section title="Work Experience" icon="fa-briefcase" color="#f59e0b">
        {(profile.experience||[]).map((e,i) => (
          <div key={i} className="prf-item-card">
            <div className="prf-item-info"><strong>{e.title}</strong> at {e.company} {e.location&&`— ${e.location}`} ({e.from} – {e.current?'Present':e.to})</div>
            <button onClick={() => removeExp(i)} className="prf-remove-btn">×</button>
          </div>
        ))}
        <div className="prf-add-grid">
          {[['title','Job Title','e.g. Software Engineer'],['company','Company','e.g. Infosys'],['location','Location','e.g. Bangalore'],['from','From','2022-06'],['to','To (leave blank if current)','2024-05']].map(([k,l,p])=>(
            <div key={k} className="prf-field"><label>{l}</label><input type="text" placeholder={p} value={newExp[k]} onChange={e=>setNewExp(p=>({...p,[k]:e.target.value}))} /></div>
          ))}
          <div className="prf-field">
            <label><input type="checkbox" checked={newExp.current} onChange={e=>setNewExp(p=>({...p,current:e.target.checked}))} style={{ marginRight:6 }} />Currently working here</label>
          </div>
          <div className="prf-field" style={{ gridColumn:'1 / -1' }}>
            <label>Description</label>
            <textarea rows={2} placeholder="Key responsibilities and achievements..." value={newExp.description} onChange={e=>setNewExp(p=>({...p,description:e.target.value}))} />
          </div>
          <button className="prf-add-btn" onClick={addExp}><i className="fas fa-plus" /> Add Experience</button>
        </div>
      </Section>

      {/* Certifications */}
      <Section title="Certifications" icon="fa-certificate" color="#06b6d4">
        {(profile.certifications||[]).map((c,i) => (
          <div key={i} className="prf-item-card">
            <div className="prf-item-info"><strong>{c.name}</strong> — {c.issuer} ({c.year}) {c.url&&<a href={c.url} target="_blank" rel="noreferrer" style={{ marginLeft:8, color:'#6366f1' }}>View</a>}</div>
            <button onClick={()=>removeCert(i)} className="prf-remove-btn">×</button>
          </div>
        ))}
        <div className="prf-add-grid">
          {[['name','Certificate Name','e.g. AWS Solutions Architect'],['issuer','Issuer','e.g. Amazon'],['year','Year','2024'],['url','Certificate URL (optional)','https://...']].map(([k,l,p])=>(
            <div key={k} className="prf-field"><label>{l}</label><input type="text" placeholder={p} value={newCert[k]} onChange={e=>setNewCert(p=>({...p,[k]:e.target.value}))} /></div>
          ))}
          <button className="prf-add-btn" onClick={addCert}><i className="fas fa-plus" /> Add Certification</button>
        </div>
      </Section>

      {/* Projects */}
      <Section title="Projects" icon="fa-laptop-code" color="#ef4444">
        {(profile.projects||[]).map((p,i) => (
          <div key={i} className="prf-item-card">
            <div className="prf-item-info"><strong>{p.name}</strong> — {p.description?.slice(0,80)}… {p.techStack?.length>0&&<span className="prf-tech-stack">{p.techStack.join(', ')}</span>}</div>
            <button onClick={()=>removeProj(i)} className="prf-remove-btn">×</button>
          </div>
        ))}
        <div className="prf-add-grid">
          {[['name','Project Name','e.g. TalentTrack AI'],['description','Description','What does it do?'],['techStack','Tech Stack (comma-separated)','e.g. React, Node.js, MongoDB'],['url','Live URL (optional)','https://...'],['github','GitHub URL (optional)','https://github.com/...']].map(([k,l,p])=>(
            <div key={k} className="prf-field"><label>{l}</label><input type="text" placeholder={p} value={newProj[k]} onChange={e=>setNewProj(pp=>({...pp,[k]:e.target.value}))} /></div>
          ))}
          <button className="prf-add-btn" onClick={addProj}><i className="fas fa-plus" /> Add Project</button>
        </div>
      </Section>

      {/* Social Links */}
      <Section title="Portfolio & Social Links" icon="fa-link" color="#6366f1">
        <div className="prf-form-grid">
          {[['github','GitHub','https://github.com/username'],['linkedin','LinkedIn','https://linkedin.com/in/username'],['portfolio','Portfolio','https://yoursite.com'],['website','Website','https://yoursite.com']].map(([k,l,p])=>(
            <div key={k} className="prf-field">
              <label><i className={`fab fa-${k === 'portfolio' || k === 'website' ? 'globe' : k}`} style={{ marginRight:6 }} />{l}</label>
              <input type="url" placeholder={p} value={profile.socialLinks?.[k]||''} onChange={e=>updNested('socialLinks',k,e.target.value)} />
            </div>
          ))}
        </div>
      </Section>

      {/* Career Goals */}
      <Section title="Career Goals" icon="fa-bullseye" color="#10b981">
        <div className="prf-form-grid">
          <div className="prf-field"><label>Target Role</label><input type="text" placeholder="e.g. Senior Data Scientist" value={profile.careerGoals?.targetRole||''} onChange={e=>updNested('careerGoals','targetRole',e.target.value)} /></div>
          <div className="prf-field"><label>Preferred Industry</label><input type="text" placeholder="e.g. FinTech, EdTech, Product" value={profile.careerGoals?.preferredIndustry||''} onChange={e=>updNested('careerGoals','preferredIndustry',e.target.value)} /></div>
          <div className="prf-field"><label>Expected Salary</label><input type="text" placeholder="e.g. ₹20 LPA" value={profile.careerGoals?.expectedSalary||''} onChange={e=>updNested('careerGoals','expectedSalary',e.target.value)} /></div>
          <div className="prf-field"><label>Work Preference</label>
            <select value={profile.careerGoals?.workPreference||''} onChange={e=>updNested('careerGoals','workPreference',e.target.value)}>
              <option value="">— Select —</option>
              {WORK_PREFS.map(w=><option key={w} value={w}>{w.charAt(0).toUpperCase()+w.slice(1)}</option>)}
            </select>
          </div>
          <div className="prf-field"><label>Timeline to Goal</label><input type="text" placeholder="e.g. 12-18 months" value={profile.careerGoals?.timeline||''} onChange={e=>updNested('careerGoals','timeline',e.target.value)} /></div>
        </div>
      </Section>

      {/* Career DNA (read-only, AI-computed) */}
      {profile.careerDNA?.computedAt && (
        <Section title="Career DNA (AI-Computed)" icon="fa-dna" color="#8b5cf6" collapsible>
          <p style={{ color:'#6b7280', fontSize:'0.85rem', marginBottom:'1rem' }}>Computed by AI based on your profile data. Update your profile and regenerate your Digital Twin to refresh.</p>
          <div className="prf-form-grid">
            {[['innovationScore','Innovation'],['leadershipScore','Leadership'],['analyticalScore','Analytical'],['communicationScore','Communication']].map(([k,l])=>(
              <div key={k} className="emp-cat-card">
                <div className="emp-cat-info">
                  <div className="emp-cat-label">{l}</div>
                  <div className="emp-cat-bar-wrap">
                    <div className="emp-cat-bar"><div className="emp-cat-fill" style={{ width:`${profile.careerDNA[k]||0}%`, background:'#8b5cf6' }} /></div>
                    <span className="emp-cat-score" style={{ color:'#8b5cf6' }}>{profile.careerDNA[k]||0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <div className="prf-save-bar">
        <button className="ra-analyze-btn" style={{ width:'auto', minWidth:180 }} onClick={save} disabled={saving}>
          {saving ? <><i className="fas fa-spinner fa-pulse" /> Saving…</> : <><i className="fas fa-save" /> Save Profile</>}
        </button>
      </div>
    </div>
  );
}
