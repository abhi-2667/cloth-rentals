import { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getEditorialPanelSrc } from '../utils/visuals';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSignup = location.pathname === '/signup';
  const isAdminLogin = location.pathname === '/admin/signin';
  const isLogin = !isSignup;
  const { login, register } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError('');
    setInfo('');
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login(email, password, isAdminLogin ? 'admin' : 'user');
        navigate('/');
        return;
      }

      const result = await register(name, email, password, address, phone);
      setInfo(result?.message || 'Account created. Waiting for admin approval.');
      setName('');
      setEmail('');
      setPassword('');
      setAddress('');
      setPhone('');
      return;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-clean-wrap auth-studio-wrap auth-page">
      <div className="auth-studio-glow" aria-hidden="true" />
      <div className="auth-page-shell glass">
        <aside className="auth-editorial" aria-hidden="true">
          <img
            src={isAdminLogin 
              ? 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1000&auto=format&fit=crop' 
              : getEditorialPanelSrc(isLogin ? 'Sign In' : 'Sign Up', isLogin ? 'party' : 'wedding')
            }
            alt=""
            className="auth-editorial-image"
          />
          <div className="auth-editorial-overlay" />
          <div className="auth-editorial-content">
            <span className="auth-editorial-kicker">LuxeRentals Studio</span>
            <h2>{isAdminLogin ? 'Admin control starts here.' : (isLogin ? 'Your next look is one step away.' : 'Create your style command center.')}</h2>
            <p>
              {isAdminLogin
                ? 'Use your admin credentials to review approvals, monitor bookings, and manage inventory.'
                : isLogin
                ? 'Track bookings, handle returns, and secure premium pieces with fast checkouts.'
                : 'Open your account to reserve curated outfits and manage approvals without friction.'}
            </p>
            <div className="auth-editorial-pills">
              <span><ShieldCheck size={14} /> Secure</span>
              <span><Star size={14} /> Curated</span>
              <span><Sparkles size={14} /> Premium</span>
            </div>
          </div>
        </aside>

        <div className="auth-clean-card auth-studio-card">
          <div className="auth-studio-header">
            <p className="auth-clean-kicker">LuxeRentals</p>
            <h1 className="auth-clean-title">{isAdminLogin ? 'Admin sign in' : (isLogin ? 'Sign in to continue' : 'Create your account')}</h1>
            <p className="auth-clean-subtitle">
              {isAdminLogin
                ? 'This portal is for approved admin accounts only.'
                : isLogin
                ? 'Use your account to manage bookings, returns, and profile in one place.'
                : 'Sign up to request bookings. Your account will be enabled after admin approval.'}
            </p>
          </div>

          {error && <div className="auth-message auth-message-error">{error}</div>}
          {info && <div className="auth-message auth-message-success">{info}</div>}

          <form onSubmit={handleSubmit} className="auth-clean-form">
            {!isLogin && (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="e.g. +1234567890" />
                </div>
                <div className="form-group">
                  <label>Home Address</label>
                  <textarea 
                    className="form-control" 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                    required 
                    placeholder="Complete delivery address"
                    rows="2"
                    style={{ resize: 'none' }}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
              />
            </div>

            <button type="submit" className="btn btn-primary w-full auth-submit-btn" disabled={isSubmitting}>
              {isLogin
                ? (isSubmitting ? 'Signing in...' : 'Sign In')
                : (isSubmitting ? 'Creating account...' : 'Create Account')}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="auth-switch-text">
            {isSignup ? 'Already have an account? ' : 'Need a customer account? '}
            <Link to={isSignup ? '/signin' : '/signup'} className="auth-switch-link">
              {isSignup ? 'Sign in' : 'Create one'}
            </Link>
          </div>

          {!isLogin && (
            <p className="auth-clean-note">
              Note: New accounts are created in pending state until approved by admin.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default AuthPage;
