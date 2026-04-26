import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ArrowRight, ShieldCheck, Sparkles, Star, X } from 'lucide-react';
import { getEditorialPanelSrc } from '../utils/visuals';

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useContext(AuthContext);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      onClose();
    } catch (err) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.message ||
        err?.message ||
        (status ? `Request failed (${status}). Please try again.` : 'Something went wrong');
      setError(message);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#040812',
      backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 100, padding: '1rem'
    }}>
      <div className="glass" style={{ width: '100%', maxWidth: '920px', overflow: 'hidden', position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1.05fr', background: '#0f1625' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: 'white', cursor: 'pointer', borderRadius: '999px', width: '40px', height: '40px', display: 'grid', placeItems: 'center', zIndex: 2 }}>
          <X size={18} />
        </button>
        <div style={{ position: 'relative', minHeight: '100%', background: '#101728', padding: '1.2rem', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ height: '100%', minHeight: '560px', borderRadius: '20px', overflow: 'hidden', position: 'relative', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }}>
            <img src={getEditorialPanelSrc(isLogin ? 'Member Access' : 'Create Account', isLogin ? 'party' : 'wedding')} alt="Fashion editorial panel" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(4,8,18,0.18), rgba(4,8,18,0.96))' }} />
            <div style={{ position: 'absolute', inset: 'auto 0 0 0', padding: '1.35rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.4rem 0.75rem', borderRadius: '999px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.14)', marginBottom: '0.9rem' }}>
                <Sparkles size={14} />
                <span style={{ fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Premium rental access</span>
              </div>
              <h2 style={{ fontSize: '2rem', lineHeight: 1.05, marginBottom: '0.6rem' }}>{isLogin ? 'Return to your wardrobe.' : 'Start with a better fit.'}</h2>
              <p style={{ color: 'rgba(255,255,255,0.82)', maxWidth: '32ch' }}>{isLogin ? 'Pick up where you left off with bookings, saved pieces, and return tracking.' : 'Create one account to browse curated pieces, book dates, and manage returns.'}</p>
              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <div style={{ padding: '0.55rem 0.75rem', borderRadius: '14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <ShieldCheck size={15} />
                  <span style={{ fontSize: '0.85rem' }}>Secure login</span>
                </div>
                <div style={{ padding: '0.55rem 0.75rem', borderRadius: '14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Star size={15} />
                  <span style={{ fontSize: '0.85rem' }}>Curated inventory</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem', background: '#0f1625' }}>
          <div style={{ marginBottom: '1.4rem' }}>
            <p style={{ color: 'var(--primary-color)', letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.55rem' }}>LuxeRentals</p>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>{isLogin ? 'Welcome back' : 'Create your account'}</h2>
            <p style={{ color: 'var(--text-muted)' }}>{isLogin ? 'Sign in to book, track, and manage your rentals.' : 'Join to reserve pieces for your next event in a few clicks.'}</p>
          </div>

          {error && <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', padding: '0.8rem 0.9rem', borderRadius: '12px', marginBottom: '1rem', color: '#ffd3d3' }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required placeholder="Your name" />
              </div>
            )}
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '1.1rem', padding: '0.9rem 1rem', borderRadius: '12px' }}>
              {isLogin ? 'Sign In' : 'Create Account'}
              <ArrowRight size={16} />
            </button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.35rem' }}>
            <button type="button" onClick={() => setIsLogin(!isLogin)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', font: 'inherit' }}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>
                {isLogin ? 'Sign up here' : 'Log in here'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
