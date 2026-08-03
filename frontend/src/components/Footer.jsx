// src/components/Footer.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';

export function FooterFull() {
  const [rating, setRating]   = useState(0);
  const [rated,  setRated]    = useState(false);

  const handleStar = (n) => {
    setRating(n);
    setRated(true);
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-col">
          <h4>TalentTrack</h4>
          <p>Bridge to your ambition.</p>
        </div>
        <div className="footer-col">
          <h4>Company</h4>
          <Link to="/about">About Us</Link>
          <Link to="/jobs">Careers</Link>
          <Link to="/help">Contact</Link>
        </div>
        <div className="footer-col">
          <h4>Rate Us ⭐</h4>
          <div className="rating-stars">
            {[1,2,3,4,5].map(n => (
              <i
                key={n}
                className={`${n <= rating ? 'fas active-star' : 'far'} fa-star`}
                onClick={() => handleStar(n)}
              />
            ))}
          </div>
          <p className="rating-message">
            {rated ? `⭐ Thanks for rating ${rating}/5! We appreciate you.` : 'Love TalentTrack? Leave a review!'}
          </p>
        </div>
      </div>
      <div className="footer-bottom">© 2026 TalentTrack — Empowering careers globally.</div>
    </footer>
  );
}

export function FooterSimple({ text = '© 2026 TalentTrack' }) {
  return (
    <footer className="footer-simple">
      <p>{text}</p>
    </footer>
  );
}
