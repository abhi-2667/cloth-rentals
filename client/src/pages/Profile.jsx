import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Clock3, UserCircle2, Wallet, BadgeCheck, CheckCircle2, Sparkles, Star, ShoppingBag } from 'lucide-react';
import { getClothImageSrc } from '../utils/visuals';
import { formatINR } from '../utils/currency';

const Profile = () => {
  const { user, updateProfile, logout } = useContext(AuthContext);
  const { toast } = useContext(ToastContext);
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileInfo, setProfileInfo] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordInfo, setPasswordInfo] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [editView, setEditView] = useState('profile');
  const [bookingFilter, setBookingFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate).toLocaleDateString();
    const end = new Date(endDate).toLocaleDateString();
    return `${start} - ${end}`;
  };

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    setName(user.name || '');
    setEmail(user.email || '');
    setAddress(user.address || '');
    setPhone(user.phone || '');
    const fetchBookings = async () => {
      try {
        const bookingRes = await api.get('/bookings/my');
        setBookings(bookingRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [user, navigate]);

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading profile...</div>;

  const activeBookings = bookings.filter((booking) => booking.status === 'booked').length;
  const returnedBookings = bookings.filter((booking) => booking.status === 'returned').length;
  const cancelledBookings = bookings.filter((booking) => booking.status === 'cancelled').length;
  const totalSpent = bookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
  const filteredBookings = bookings.filter((booking) => {
    if (bookingFilter === 'all') return true;
    return booking.status === bookingFilter;
  });

  const canCancelBooking = (booking) => {
    if (booking.status !== 'booked') return false;
    return new Date(booking.startDate) > new Date(new Date().toDateString());
  };

  const refreshBookings = async () => {
    const bookingRes = await api.get('/bookings/my');
    setBookings(bookingRes.data);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (isUpdatingProfile) return;

    setProfileError('');
    setProfileInfo('');

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedName || normalizedName.length < 2) {
      setProfileError('Name must be at least 2 characters long.');
      return;
    }

    if (!normalizedEmail) {
      setProfileError('Email is required.');
      return;
    }

    setIsUpdatingProfile(true);

    try {
      await updateProfile({ name: normalizedName, email: normalizedEmail, address: address.trim(), phone: phone.trim() });
      setProfileInfo('Profile updated successfully.');
    } catch (err) {
      setProfileError(err?.response?.data?.message || 'Unable to update email right now.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (isUpdatingPassword) return;

    setPasswordError('');
    setPasswordInfo('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      await api.put('/users/profile', { password: newPassword });
      setPasswordInfo('Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err?.response?.data?.message || 'Unable to update password right now.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const confirmed = window.confirm('Cancel this booking?');
    if (!confirmed) return;

    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      await refreshBookings();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to cancel booking right now.');
    }
  };

  const handleRequestReturn = async (bookingId) => {
    const confirmed = window.confirm('Initiate return process for this item?');
    if (!confirmed) return;

    try {
      await api.put(`/bookings/${bookingId}/request-return`);
      await refreshBookings();
      toast.success('Return requested successfully. Admin will review it.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to initiate return right now.');
    }
  };

  return (
    <div className="profile-page">
      <section className="glass profile-hero fade-up">
        <div className="profile-hero-main">
          <p className="profile-kicker">Personal Dashboard</p>
          <h1>Welcome back, {user?.name || 'Renter'}</h1>
          <p className="profile-subtitle">Track reservations, status updates, and spending in one place.</p>

          <div className="profile-hero-tags">
            <span><BadgeCheck size={14} /> Verified member</span>
            <span><Sparkles size={14} /> Premium closet access</span>
          </div>

          <div className="profile-quick-actions">
            <Link to="/notifications" className="btn btn-outline">Notifications</Link>
            <Link to="/browse" className="btn btn-primary">Browse Outfits</Link>
          </div>
        </div>

        <aside className="profile-account-card glass">
          <p className="profile-account-label">Account</p>
          <p className="profile-account-value"><UserCircle2 size={18} /> {user?.email}</p>
          <p className="profile-account-verified"><BadgeCheck size={18} /> Active & verified</p>
        </aside>
      </section>

      <section className="profile-stats-grid fade-up-delay">
        <article
          className="glass profile-stat-card"
          style={{ '--stat-color': 'var(--primary-color)', '--stat-bg': 'rgba(212, 175, 55, 0.15)' }}
        >
          <span className="profile-stat-icon"><Clock3 size={18} /></span>
          <p className="profile-stat-label">Active Rentals</p>
          <h3 className="profile-stat-value">{activeBookings}</h3>
        </article>

        <article
          className="glass profile-stat-card"
          style={{ '--stat-color': 'var(--success)', '--stat-bg': 'rgba(16, 185, 129, 0.15)' }}
        >
          <span className="profile-stat-icon"><CheckCircle2 size={18} /></span>
          <p className="profile-stat-label">Completed</p>
          <h3 className="profile-stat-value">{returnedBookings}</h3>
        </article>

        <article
          className="glass profile-stat-card"
          style={{ '--stat-color': 'var(--accent-color)', '--stat-bg': 'rgba(247, 225, 181, 0.15)' }}
        >
          <span className="profile-stat-icon"><Wallet size={18} /></span>
          <p className="profile-stat-label">Total Spent</p>
          <h3 className="profile-stat-value">{formatINR(totalSpent)}</h3>
        </article>

        <article
          className="glass profile-stat-card"
          style={{ '--stat-color': 'var(--danger)', '--stat-bg': 'rgba(248, 113, 113, 0.14)', opacity: cancelledBookings === 0 ? 0.4 : 1 }}
        >
          <span className="profile-stat-icon"><CheckCircle2 size={18} /></span>
          <p className="profile-stat-label">Cancelled</p>
          <h3 className="profile-stat-value">{cancelledBookings}</h3>
        </article>
      </section>

      <section className="profile-main-grid">
        <div className="glass profile-password-card">
          <h2><UserCircle2 size={20} /> Edit Options</h2>
          <p className="profile-card-subtitle">Choose what you want to update.</p>

          <div className="profile-booking-tabs" style={{ marginBottom: '0.8rem' }}>
            <button
              type="button"
              className={`profile-tab-btn ${editView === 'profile' ? 'active' : ''}`}
              onClick={() => setEditView('profile')}
            >
              Edit Profile
            </button>
            <button
              type="button"
              className={`profile-tab-btn ${editView === 'password' ? 'active' : ''}`}
              onClick={() => setEditView('password')}
            >
              Change Password
            </button>
          </div>

          {editView === 'profile' && (
            <>
              {profileError && (
                <div className="profile-msg profile-msg-error">
                  {profileError}
                </div>
              )}

              {profileInfo && (
                <div className="profile-msg profile-msg-success">
                  {profileInfo}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="profile-password-form">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    minLength={2}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1234567890"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Home Address</label>
                  <textarea
                    className="form-control"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Complete delivery address"
                    rows="2"
                    style={{ resize: 'none' }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={isUpdatingProfile} style={{ width: 'fit-content' }}>
                  {isUpdatingProfile ? 'Updating...' : 'Save Changes'}
                </button>
              </form>
            </>
          )}

          {editView === 'password' && (
            <>
              {passwordError && (
                <div className="profile-msg profile-msg-error">
                  {passwordError}
                </div>
              )}

              {passwordInfo && (
                <div className="profile-msg profile-msg-success">
                  {passwordInfo}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="profile-password-form">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    minLength={8}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    minLength={8}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={isUpdatingPassword} style={{ width: 'fit-content' }}>
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="glass profile-bookings-card">
          <div className="profile-section-heading-row profile-bookings-header">
            <div>
              <h2><Clock3 size={20} /> Booking History</h2>
              <p>Every reservation and return status at a glance.</p>
            </div>
            {bookings.length > 0 && <span className="profile-pill">{bookings.length} total</span>}
          </div>

          <div className="profile-booking-tabs">
            <button
              type="button"
              className={`profile-tab-btn ${bookingFilter === 'all' ? 'active' : ''}`}
              onClick={() => setBookingFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`profile-tab-btn ${bookingFilter === 'booked' ? 'active' : ''}`}
              onClick={() => setBookingFilter('booked')}
            >
              Active
            </button>
            <button
              type="button"
              className={`profile-tab-btn ${bookingFilter === 'returned' ? 'active' : ''}`}
              onClick={() => setBookingFilter('returned')}
            >
              Completed
            </button>
            <button
              type="button"
              className={`profile-tab-btn ${bookingFilter === 'cancelled' ? 'active' : ''}`}
              onClick={() => setBookingFilter('cancelled')}
            >
              Cancelled
            </button>
          </div>

          {filteredBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', display: 'grid', gap: '0.75rem', justifyItems: 'center' }}>
              <ShoppingBag size={28} color="var(--text-muted)" />
              <h3 style={{ margin: 0 }}>No rentals yet</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>Browse our catalog to find your perfect outfit.</p>
              <Link to="/browse" className="btn btn-primary">Browse Catalog</Link>
            </div>
          ) : (
            <div className="profile-bookings-list">
              {filteredBookings.map((booking) => (
                <article key={booking._id} className="profile-booking-item">
                  <div className="profile-booking-main">
                    <div className="profile-booking-thumb">
                      {booking.clothId && booking.clothId.imageUrl && (
                        <img src={getClothImageSrc(booking.clothId)} alt="" />
                      )}
                    </div>

                    <div className="profile-booking-copy">
                      <h3>{booking.clothId?.title || 'Item Unavailable'}</h3>
                      <p>{formatDateRange(booking.startDate, booking.endDate)}</p>
                    </div>
                  </div>

                  <div className="profile-booking-meta">
                    <p>{formatINR(booking.totalPrice)}</p>
                    <span className={`profile-status-chip ${booking.status === 'returned' ? 'is-returned' : booking.status === 'cancelled' ? 'is-cancelled' : booking.status === 'return_requested' ? 'is-booked' : 'is-booked'}`} style={{ borderColor: booking.status === 'return_requested' ? '#f59e0b' : '', color: booking.status === 'return_requested' ? '#f59e0b' : '' }}>
                      {booking.status.replace('_', ' ').toUpperCase()}
                    </span>
                    {booking.status === 'returned' && (
                      <Link
                        to={'/cloth/' + (booking.clothId?._id || booking.clothId)}
                        style={{ fontSize: '0.78rem', color: 'var(--primary-color)', marginTop: '0.3rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Star size={12} />Leave a review
                      </Link>
                    )}
                    {booking.status === 'booked' && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ marginTop: '0.75rem', padding: '0.45rem 0.8rem', fontSize: '0.82rem', borderColor: 'var(--success)', color: 'var(--success)' }}
                        onClick={() => handleRequestReturn(booking._id)}
                      >
                        Initiate Return
                      </button>
                    )}
                    {canCancelBooking(booking) && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ marginTop: '0.75rem', padding: '0.45rem 0.8rem', fontSize: '0.82rem' }}
                        onClick={() => handleCancelBooking(booking._id)}
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ marginTop: '1rem' }}>
        <div className="glass" style={{ border: '1px solid rgba(239, 68, 68, 0.5)', background: 'rgba(239, 68, 68, 0.05)', padding: '1.1rem' }}>
          <h2 style={{ marginBottom: '0.35rem', color: '#ffb4ab' }}>Danger Zone</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Deleting your account is permanent and will remove your rentals and saved activity.
          </p>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete Account
          </button>
        </div>
      </section>

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <h3 style={{ color: '#ffb4ab', marginBottom: '0.5rem' }}>Confirm Account Deletion</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              This action is permanent. All your active rentals and saved history will be erased.
            </p>
            {deleteError && <div className="profile-msg profile-msg-error" style={{ marginBottom: '1rem' }}>{deleteError}</div>}
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Enter password to confirm:</label>
              <input 
                type="password" 
                className="form-control" 
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Current password"
                autoFocus
              />
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button 
                className="btn btn-outline" 
                onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError(''); }}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                disabled={isDeleting || !deletePassword} 
                onClick={async () => {
                  setIsDeleting(true);
                  setDeleteError('');
                  try {
                    await api.delete('/users/profile', { data: { password: deletePassword } });
                    logout();
                    navigate('/signin');
                  } catch (err) {
                    setDeleteError(err?.response?.data?.message || 'Unable to delete account right now.');
                    setIsDeleting(false);
                  }
                }}
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
