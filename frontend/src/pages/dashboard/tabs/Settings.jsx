// src/pages/dashboard/tabs/Settings.jsx
import { useState, useEffect } from 'react';
import { ProfileService } from '../../../services/api.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { apiRequest, BACKEND_URL } from '../../../services/api.js';

const SECTIONS = ['Account','Privacy','AI Settings','Theme & Language','Data','Danger Zone'];

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

          {/* Privacy */}
          {activeSection === 'Privacy' && (
            <div className="stg-panel">
              <h3>Privacy Settings</h3>
              {[
                { key:'recruiterAccess', label:'Recruiter Access', desc:'Allow recruiters to discover your profile' },
                { key:'anonymousMode',   label:'Anonymous Mode',   desc:'Hide your name from recruiters while browsing' },
                { key:'dataSharing',     label:'Data Sharing',     desc:'Share anonymised data to improve AI recommendations' },
              ].map(item => (
                <div key={item.key} className="stg-toggle-row">
                  <div><div className="stg-toggle-label">{item.label}</div><div className="stg-toggle-desc">{item.desc}</div></div>
                  <label className="stg-switch">
                    <input type="checkbox" checked={settings.privacy?.[item.key]||false} onChange={e => updSetting('privacy', item.key, e.target.checked)} />
                    <span className="stg-slider" />
                  </label>
                </div>
              ))}
              <button className="prf-add-btn" onClick={saveSettings} disabled={saving} style={{ marginTop:'1.5rem' }}>
                {saving ? 'Saving…' : 'Save Privacy Settings'}
              </button>
            </div>
          )}

          {/* AI Settings */}
          {activeSection === 'AI Settings' && (
            <div className="stg-panel">
              <h3>AI Preferences</h3>
              <div className="prf-field"><label>Recommendation Frequency</label>
                <select value={settings.recommendationFrequency} onChange={e => setSettings(p=>({...p,recommendationFrequency:e.target.value}))}>
                  {['daily','weekly','manual'].map(v=><option key={v} value={v}>{v.charAt(0).toUpperCase()+v.slice(1)}</option>)}
                </select>
              </div>
              <div className="prf-field"><label>Forecast Frequency</label>
                <select value={settings.forecastFrequency} onChange={e => setSettings(p=>({...p,forecastFrequency:e.target.value}))}>
                  {['weekly','monthly','manual'].map(v=><option key={v} value={v}>{v.charAt(0).toUpperCase()+v.slice(1)}</option>)}
                </select>
              </div>
              {[
                { key:'personalization', label:'Personalisation', desc:'Use your profile data to personalise AI responses' },
                { key:'contextMemory',   label:'Context Memory',  desc:'Remember conversation context across sessions' },
              ].map(item => (
                <div key={item.key} className="stg-toggle-row">
                  <div><div className="stg-toggle-label">{item.label}</div><div className="stg-toggle-desc">{item.desc}</div></div>
                  <label className="stg-switch">
                    <input type="checkbox" checked={settings.ai?.[item.key]||false} onChange={e => updSetting('ai', item.key, e.target.checked)} />
                    <span className="stg-slider" />
                  </label>
                </div>
              ))}
              <h4 style={{ marginTop:'1.5rem' }}>Notifications</h4>
              {[['email','Email notifications'],['inApp','In-app notifications'],['achievements','Achievement alerts'],['jobAlerts','Job match alerts']].map(([k,l]) => (
                <div key={k} className="stg-toggle-row">
                  <div className="stg-toggle-label">{l}</div>
                  <label className="stg-switch">
                    <input type="checkbox" checked={settings.notifications?.[k]||false} onChange={e => updSetting('notifications', k, e.target.checked)} />
                    <span className="stg-slider" />
                  </label>
                </div>
              ))}
              <button className="prf-add-btn" onClick={saveSettings} disabled={saving} style={{ marginTop:'1.5rem' }}>
                {saving ? 'Saving…' : 'Save AI Settings'}
              </button>
            </div>
          )}

          {/* Theme & Language */}
          {activeSection === 'Theme & Language' && (
            <div className="stg-panel">
              <h3>Theme & Language</h3>
              <div className="prf-field"><label>Theme</label>
                <div className="stg-theme-opts">
                  {['light','dark','system'].map(t => (
                    <button key={t} className={`stg-theme-btn${settings.theme===t?' active':''}`} onClick={() => setSettings(p=>({...p,theme:t}))}>
                      <i className={`fas fa-${t==='light'?'sun':t==='dark'?'moon':'desktop'}`} /> {t.charAt(0).toUpperCase()+t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="prf-field"><label>Language</label>
                <select value={settings.language} onChange={e => setSettings(p=>({...p,language:e.target.value}))}>
                  {[['en','English'],['hi','हिंदी'],['ta','தமிழ்'],['kn','ಕನ್ನಡ'],['te','తెలుగు']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <button className="prf-add-btn" onClick={saveSettings} disabled={saving} style={{ marginTop:'1rem' }}>
                {saving ? 'Saving…' : 'Save Preferences'}
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
                <a href={`${BACKEND_URL}/api/profile/export`} className="prf-add-btn" download>
                  <i className="fas fa-download" /> Export
                </a>
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
