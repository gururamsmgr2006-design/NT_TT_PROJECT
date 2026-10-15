// src/pages/dashboard/tabs/Settings.jsx
import { useState, useEffect } from 'react';
import { ProfileService } from '../../../services/api.js';
import { useAuth } from '../../../context/AuthContext.jsx';
  import { apiRequest, BACKEND_URL, getToken } from '../../../services/api.js';
  import { jsPDF } from 'jspdf';

const SECTIONS = ['Account','Data','Danger Zone'];

export default function Settings() {
  const { user, logout, refreshUser } = useAuth();
  const [activeSection, setActive]   = useState('Account');
  const [settings,  setSettings]     = useState({ theme:'light', language:'en', recommendationFrequency:'weekly', forecastFrequency:'monthly', notifications:{ email:true, inApp:true, achievements:true, jobAlerts:true }, privacy:{ recruiterAccess:true, anonymousMode:false, dataSharing:false }, ai:{ personalization:true, contextMemory:true } });
  const [saving,    setSaving]        = useState(false);
  const [saved,     setSaved]         = useState(false);
  const [error,     setError]         = useState('');

  // Change Password
  const [pwdForm,   setPwdForm]       = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [pwdSaving, setPwdSaving]     = useState(false);
  const [pwdMsg,    setPwdMsg]        = useState('');
  const [pwdErr,    setPwdErr]        = useState('');

  // Delete Account
  const [delForm,   setDelForm]       = useState({ email:'', password:'' });
  const [verified,  setVerified]      = useState(false);
  const [deleting,  setDeleting]      = useState(false);
  const [verifying, setVerifying]     = useState(false);
  const [delErr,    setDelErr]        = useState('');

  useEffect(() => {
    ProfileService.getFull().then(res => {
      if (res.user?.settings) setSettings(s => ({ ...s, ...res.user.settings }));
    }).catch(()=>{});
  }, []);

  const updSetting = (section, key, val) =>
    setSettings(p => ({ ...p, [section]: { ...(p[section]||{}), [key]: val } }));

  const saveSettings = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      await ProfileService.updateSettings({ settings });
      setSaved(true);
      await refreshUser();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { setError(err.message || 'Failed to save settings.'); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    setPwdErr(''); setPwdMsg('');
    if (!pwdForm.currentPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) { setPwdErr('All fields are required.'); return; }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) { setPwdErr('New passwords do not match.'); return; }
    if (pwdForm.newPassword.length < 8) { setPwdErr('Password must be at least 8 characters.'); return; }
    if (!/[A-Z]/.test(pwdForm.newPassword)) { setPwdErr('Must contain at least one uppercase letter.'); return; }
    if (!/[0-9]/.test(pwdForm.newPassword)) { setPwdErr('Must contain at least one number.'); return; }
    setPwdSaving(true);
    try {
      await apiRequest('/api/users/change-password', { method:'PUT', body: JSON.stringify({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword }) });
      setPwdMsg('Password changed successfully!');
      setPwdForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch (err) { setPwdErr(err.message || 'Failed to change password.'); }
    finally { setPwdSaving(false); }
  };

  const verifyForDelete = async () => {
    setDelErr(''); setVerifying(true);
    try {
      await ProfileService.verifyDelete({ email: delForm.email, password: delForm.password });
      setVerified(true);
    } catch (err) { setDelErr(err.message || 'Invalid credentials.'); }
    finally { setVerifying(false); }
  };

  const deleteAccount = async () => {
    if (!window.confirm('This action is PERMANENT and cannot be undone. All your data will be deleted. Are you absolutely sure?')) return;
    setDeleting(true); setDelErr('');
    try {
      await ProfileService.deleteAccount({ email: delForm.email, password: delForm.password });
      logout();
    } catch (err) { setDelErr(err.message || 'Failed to delete account.'); }
    finally { setDeleting(false); }
  };

      // ── Export helpers: turn raw JSON into a readable report ──
  const buildReport = (d) => {
    const u = d.user || {}, p = d.profile || {};
    const L = [];
    const add = (t = '') => L.push(t);
    const head = (t) => { add(); add(t.toUpperCase()); add('-'.repeat(t.length)); };
    const fmt = (x) => (x ? new Date(x).toLocaleDateString() : '');

    add('TALENTTRACK - MY DATA EXPORT');
    add(`Exported on: ${new Date(d.exportedAt).toLocaleString()}`);

    head('Account');
    add(`Name: ${u.fullName || '-'}`);
    add(`Email: ${u.email || '-'}`);
    add(`Role: ${u.role || '-'}`);
    if (u.phone) add(`Phone: ${u.phone}`);
    if (u.location) add(`Location: ${u.location}`);
    if (u.bio) add(`Bio: ${u.bio}`);
    if (u.createdAt) add(`Member since: ${fmt(u.createdAt)}`);

    head('Profile');
    if (p.headline) add(`Headline: ${p.headline}`);
    if (p.currentRole) add(`Current role: ${p.currentRole}${p.currentCompany ? ' at ' + p.currentCompany : ''}`);
    add(`Years of experience: ${p.yearsExperience ?? 0}`);
    if (p.summary) add(`Summary: ${p.summary}`);

    if (p.skills?.length) { head('Skills'); p.skills.forEach(s => add(`- ${s.name} (${s.level}, ${s.yearsUsed || 0} yrs)`)); }
    if (p.experience?.length) { head('Experience'); p.experience.forEach(e => { add(`- ${e.title} @ ${e.company} (${e.from || '?'} - ${e.current ? 'Present' : e.to || '?'})`); if (e.description) add(`  ${e.description}`); }); }
    if (p.education?.length) { head('Education'); p.education.forEach(e => add(`- ${e.degree || ''} ${e.field ? 'in ' + e.field : ''}, ${e.institution || ''} ${e.year ? '(' + e.year + ')' : ''}`)); }
    if (p.certifications?.length) { head('Certifications'); p.certifications.forEach(c => add(`- ${c.name}${c.issuer ? ' - ' + c.issuer : ''}${c.year ? ' (' + c.year + ')' : ''}`)); }
    if (p.projects?.length) { head('Projects'); p.projects.forEach(pr => { add(`- ${pr.name}${pr.techStack?.length ? ' [' + pr.techStack.join(', ') + ']' : ''}`); if (pr.description) add(`  ${pr.description}`); }); }
    if (p.interests?.length) { head('Interests'); add(p.interests.join(', ')); }
    const g = p.careerGoals || {};
    if (g.targetRole || g.preferredIndustry || g.expectedSalary) {
      head('Career Goals');
      if (g.targetRole) add(`Target role: ${g.targetRole}`);
      if (g.preferredIndustry) add(`Industry: ${g.preferredIndustry}`);
      if (g.expectedSalary) add(`Expected salary: ${g.expectedSalary}`);
    }
    return L;
  };

  const exportData = async (format) => {
    try {
      const r = await fetch(`${BACKEND_URL}/api/profile/export`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!r.ok) throw new Error('Export failed. Please try again.');
      const lines = buildReport(await r.json());

      if (format === 'txt') {
        const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }));
        const a = document.createElement('a');
        a.href = url; a.download = 'talenttrack-my-data.txt'; a.click();
        URL.revokeObjectURL(url);
      } else {
        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        const pageH = doc.internal.pageSize.getHeight();
        let y = 50;
        lines.forEach((ln, i) => {
          const isTitle = i === 0;
          const isHead = ln && ln === ln.toUpperCase() && /[A-Z]/.test(ln) && !ln.startsWith('-') && !ln.startsWith(' ');
          doc.setFont('helvetica', isTitle || isHead ? 'bold' : 'normal');
          doc.setFontSize(isTitle ? 18 : isHead ? 13 : 10);
          doc.splitTextToSize(ln || ' ', 495).forEach(part => {
            if (y > pageH - 50) { doc.addPage(); y = 50; }
            doc.text(part, 50, y);
            y += isTitle ? 26 : isHead ? 20 : 15;
          });
        });
        doc.save('talenttrack-my-data.pdf');
      }
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="stg-container">
      <div className="sg-header"><h2><i className="fas fa-cog" /> Settings</h2><p>Manage your account, privacy, and AI preferences.</p></div>

      <div className="stg-layout">
        <nav className="stg-nav">
          {SECTIONS.map(s => (
            <button key={s} className={`stg-nav-btn${activeSection===s?' active':''}`}
              style={s==='Danger Zone'?{ color:'#ef4444' }:{}} onClick={() => setActive(s)}>
              <i className={`fas fa-${s==='Account'?'user':s==='Privacy'?'shield-alt':s==='AI Settings'?'robot':s==='Theme & Language'?'palette':s==='Data'?'database':'trash-alt'}`} />
              {s}
            </button>
          ))}
        </nav>

        <div className="stg-content">
          {saved  && <div className="prf-success"><i className="fas fa-check-circle" /> Settings saved!</div>}
          {error  && <div className="ra-error"><i className="fas fa-exclamation-circle" /> {error}</div>}

          {/* Account */}
          {activeSection === 'Account' && (
            <div className="stg-panel">
              <h3>Account Settings</h3>
              <div className="stg-info-row"><span>Name</span><strong>{user?.fullName}</strong></div>
              <div className="stg-info-row"><span>Email</span><strong>{user?.email}</strong></div>
              <div className="stg-info-row"><span>Role</span><strong className="prf-skill-tag" style={{ display:'inline-block' }}>{user?.role}</strong></div>
              <div className="stg-divider" />
              <h4>Change Password</h4>
              <p style={{ color:'#6b7280', fontSize:'0.85rem', marginBottom:'1rem' }}>If you've forgotten your password, use the <strong>Forgot Password</strong> link on the login page, or contact us via the <strong>Help &amp; Feedback</strong> form.</p>
              {pwdMsg && <div className="prf-success"><i className="fas fa-check-circle" /> {pwdMsg}</div>}
              {pwdErr && <div className="ra-error"><i className="fas fa-exclamation-circle" /> {pwdErr}</div>}
              {[['currentPassword','Current Password'],['newPassword','New Password'],['confirmPassword','Confirm New Password']].map(([k,l]) => (
                <div key={k} className="prf-field">
                  <label>{l}</label>
                  <input type="password" placeholder={`Enter ${l.toLowerCase()}`} value={pwdForm[k]} onChange={e => setPwdForm(p=>({...p,[k]:e.target.value}))} />
                </div>
              ))}
              <button className="prf-add-btn" onClick={changePassword} disabled={pwdSaving} style={{ marginTop:'0.5rem' }}>
                {pwdSaving ? <><i className="fas fa-spinner fa-pulse" /> Changing…</> : 'Change Password'}
              </button>
            </div>
          )}

          {/* Data */}
          {activeSection === 'Data' && (
            <div className="stg-panel">
              <h3>Data Management</h3>
              <div className="stg-data-card">
                <div><i className="fas fa-download" style={{ color:'#6366f1', fontSize:'1.5rem' }} /></div>
                <div><h4>Export My Data</h4><p>Download a complete copy of your profile, analyses, and career data in JSON format.</p></div>
                  <button className="prf-add-btn" onClick={async () => {
    try {
      const r = await fetch(`${BACKEND_URL}/api/profile/export`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!r.ok) throw new Error('Export failed');
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement('a');
      a.href = url; a.download = 'talenttrack-data-export.json'; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { setError(e.message); }
  }}>
    <i className="fas fa-download" /> Export
  </button>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          {activeSection === 'Danger Zone' && (
            <div className="stg-panel">
              <h3 style={{ color:'#ef4444' }}><i className="fas fa-exclamation-triangle" /> Danger Zone</h3>
              <div className="stg-danger-card">
                <h4>Delete Account</h4>
                <p>This will permanently delete your account, profile, all AI analyses, applications, and career data. <strong>This cannot be undone.</strong></p>
                {delErr && <div className="ra-error"><i className="fas fa-exclamation-circle" /> {delErr}</div>}
                {!verified ? (
                  <>
                    <p style={{ color:'#6b7280', fontSize:'0.85rem', marginBottom:'0.75rem' }}>Enter your TalentTrack email and password to confirm your identity:</p>
                    <div className="prf-field"><label>Email</label><input type="email" placeholder="your@email.com" value={delForm.email} onChange={e=>setDelForm(p=>({...p,email:e.target.value}))} /></div>
                    <div className="prf-field"><label>Password</label><input type="password" placeholder="Your password" value={delForm.password} onChange={e=>setDelForm(p=>({...p,password:e.target.value}))} /></div>
                    <button className="stg-danger-verify-btn" onClick={verifyForDelete} disabled={verifying}>
                      {verifying ? <><i className="fas fa-spinner fa-pulse" /> Verifying…</> : 'Verify Identity'}
                    </button>
                  </>
                ) : (
                  <div className="stg-danger-confirmed">
                    <p style={{ color:'#10b981' }}><i className="fas fa-check-circle" /> Identity verified. Click below to permanently delete your account.</p>
                    <button className="stg-danger-delete-btn" onClick={deleteAccount} disabled={deleting}>
                      {deleting ? <><i className="fas fa-spinner fa-pulse" /> Deleting…</> : <><i className="fas fa-trash" /> Delete My Account Forever</>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
