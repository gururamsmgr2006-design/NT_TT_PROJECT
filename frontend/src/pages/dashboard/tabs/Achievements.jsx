// src/pages/dashboard/tabs/Achievements.jsx
import { useState, useEffect } from 'react';
import { AchievementService } from '../../../services/api.js';

const RARITY_CONFIG = {
  common:    { label:'Common',    color:'#6b7280', bg:'#6b728015', stars:1 },
  rare:      { label:'Rare',      color:'#6366f1', bg:'#6366f115', stars:2 },
  epic:      { label:'Epic',      color:'#8b5cf6', bg:'#8b5cf615', stars:3 },
  legendary: { label:'Legendary', color:'#f59e0b', bg:'#f59e0b15', stars:4 },
};

const CAT_LABELS = {
  career:'Career', learning:'Learning', skill:'Skills',
  employability:'Employability', streak:'Streaks', hidden:'Hidden'
};

function StarRating({ count }) {
  return <span>{Array.from({ length: count }, (_, i) => <span key={i} style={{ color:'#f59e0b', fontSize:'10px' }}>★</span>)}</span>;
}

export default function Achievements() {
  const [badges,   setBadges]   = useState([]);
  const [progress, setProgress] = useState({});
  const [streaks,  setStreaks]  = useState({});
  const [points,   setPoints]   = useState(0);
  const [level,    setLevel]    = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [checking, setChecking] = useState(false);
  const [newBadges,setNewBadges]= useState([]);
  const [filter,   setFilter]   = useState('all');

  const load = async () => {
    try {
      const res = await AchievementService.get();
      setBadges(res.badges || []);
      setProgress(res.progress || {});
      setStreaks(res.streaks || {});
      setPoints(res.totalPoints || 0);
      setLevel(res.level || 1);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const checkNew = async () => {
    setChecking(true);
    try {
      const res = await AchievementService.check();
      setNewBadges(res.newBadges || []);
      setPoints(res.totalPoints);
      setLevel(res.level);
      await load();
      setTimeout(() => setNewBadges([]), 5000);
    } catch {} finally { setChecking(false); }
  };

  const earned    = badges.filter(b => b.earned);
  const locked    = badges.filter(b => !b.earned && !b.hidden);
  const hidden    = badges.filter(b => !b.earned && b.hidden);
  const cats      = ['all', ...Object.keys(CAT_LABELS)];
  const displayed = filter === 'all' ? badges : badges.filter(b => b.category === filter);
  const nextLevel = level * 100;

  if (loading) return <div className="cdt-loading"><i className="fas fa-spinner fa-pulse" /> Loading achievements…</div>;

  return (
    <div className="ach-container">
      <div className="sg-header">
        <h2><i className="fas fa-trophy" /> Achievements</h2>
        <p>Track your career milestones, earn badges, and celebrate your growth.</p>
      </div>

      {/* New badge toast */}
      {newBadges.length > 0 && (
        <div className="ach-new-toast">
          🎉 You earned {newBadges.length} new badge{newBadges.length > 1 ? 's' : ''}!{' '}
          {newBadges.map(b => <span key={b.id}>{b.icon} {b.name}</span>)}
        </div>
      )}

      {/* Level card */}
      <div className="ach-level-card">
        <div className="ach-level-left">
          <div className="ach-level-badge">Lv.{level}</div>
          <div>
            <div className="ach-level-title">Career Level {level}</div>
            <div className="ach-level-pts">{points} / {nextLevel} points to next level</div>
          </div>
        </div>
        <div className="ach-level-right">
          <div className="ach-stats-row">
            <div className="ach-stat"><span className="ach-stat-val" style={{ color:'#10b981' }}>{earned.length}</span><span className="ach-stat-label">Earned</span></div>
            <div className="ach-stat"><span className="ach-stat-val" style={{ color:'#6b7280' }}>{locked.length}</span><span className="ach-stat-label">Locked</span></div>
            <div className="ach-stat"><span className="ach-stat-val" style={{ color:'#8b5cf6' }}>{hidden.length}</span><span className="ach-stat-label">Hidden</span></div>
          </div>
          <div className="ach-level-bar-wrap">
            <div className="ach-level-bar"><div style={{ width:`${Math.min((points / nextLevel) * 100, 100)}%`, background:'#6366f1', height:'100%', borderRadius:4, transition:'width 0.8s ease' }} /></div>
          </div>
        </div>
        <button className="ra-new-btn" onClick={checkNew} disabled={checking}>
          {checking ? <><i className="fas fa-spinner fa-pulse" /> Checking…</> : <><i className="fas fa-sync-alt" /> Check New</>}
        </button>
      </div>

      {/* Progress trackers */}
      <div className="ach-progress-grid">
        {[
          { label:'Resumes Uploaded',  val: progress.resumeUploads     || 0, max:5,  color:'#6366f1' },
          { label:'Applications Sent', val: progress.applicationsCount  || 0, max:20, color:'#10b981' },
          { label:'Interviews',        val: progress.interviewsCount    || 0, max:5,  color:'#f59e0b' },
          { label:'AI Chats',          val: progress.aiChatsCount       || 0, max:20, color:'#8b5cf6' },
        ].map((p, i) => (
          <div key={i} className="ach-prog-card">
            <div className="ach-prog-label">{p.label}</div>
            <div className="ach-prog-val" style={{ color: p.color }}>{p.val} / {p.max}</div>
            <div className="ach-prog-bar"><div style={{ width:`${Math.min((p.val/p.max)*100,100)}%`, background: p.color, height:'100%', borderRadius:4 }} /></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="ci-filters" style={{ marginBottom:'1.5rem' }}>
        {cats.map(c => (
          <button key={c} className={`ci-filter-btn${filter===c?' active':''}`} onClick={() => setFilter(c)}>
            {c === 'all' ? `All (${badges.length})` : `${CAT_LABELS[c]} (${badges.filter(b => b.category===c).length})`}
          </button>
        ))}
      </div>

      {/* Badge grid */}
      <div className="ach-badge-grid">
        {displayed.map((badge, i) => {
          const cfg = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.common;
          return (
            <div key={i} className={`ach-badge-card${badge.earned ? ' earned' : ' locked'}`}
              style={{ borderColor: badge.earned ? cfg.color : '#e5e7eb', background: badge.earned ? cfg.bg : '#f9fafb' }}>
              <div className="ach-badge-icon" style={{ filter: badge.earned ? 'none' : 'grayscale(100%) opacity(0.4)' }}>
                {badge.hidden && !badge.earned ? '🔒' : badge.icon}
              </div>
              <div className="ach-badge-name" style={{ color: badge.earned ? cfg.color : '#9ca3af' }}>
                {badge.hidden && !badge.earned ? '???' : badge.name}
              </div>
              <div className="ach-badge-rarity"><StarRating count={cfg.stars} /> <span style={{ color:cfg.color, fontSize:'10px' }}>{cfg.label}</span></div>
              <div className="ach-badge-desc" style={{ color:'#6b7280' }}>
                {badge.hidden && !badge.earned ? 'Mystery achievement' : badge.description}
              </div>
              {badge.earned && badge.earnedAt && (
                <div className="ach-badge-date">✓ {new Date(badge.earnedAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Streak */}
      {(streaks.currentDailyStreak > 0 || streaks.longestStreak > 0) && (
        <div className="ach-streak-card">
          <span className="ach-streak-fire">🔥</span>
          <div><strong>{streaks.currentDailyStreak}</strong> day streak</div>
          <div style={{ color:'#6b7280', fontSize:'0.85rem' }}>Longest: {streaks.longestStreak} days</div>
        </div>
      )}
    </div>
  );
}
