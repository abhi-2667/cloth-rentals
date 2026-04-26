import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const Notifications = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }

    const fetchNotifications = async () => {
      try {
        const res = await api.get('/users/notifications');
        setNotifications(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user, navigate]);

  const markNotificationRead = async (id) => {
    try {
      await api.put(`/users/notifications/${id}/read`);
      setNotifications((prev) => prev.map((item) => (
        item._id === id ? { ...item, isRead: true } : item
      )));
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading notifications...</div>;
  }

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <div className="profile-page">
      <section className="glass profile-notifications-card fade-up" style={{ padding: '1.25rem' }}>
        <div className="profile-section-heading-row">
          <div>
            <p className="profile-kicker">Inbox</p>
            <h2><Bell size={20} /> Notifications</h2>
            <p className="profile-card-subtitle">Stay updated on bookings, approvals, and account events.</p>
          </div>
          <span className="profile-pill">{unreadCount} unread</span>
        </div>

        {notifications.length === 0 ? (
          <p className="profile-empty-text">No notifications yet.</p>
        ) : (
          <div className="profile-notification-list" style={{ marginTop: '1rem' }}>
            {notifications.map((item) => (
              <div
                key={item._id}
                className={`profile-notification-item ${item.isRead ? 'is-read' : 'is-unread'}`}
              >
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.message}</p>
                  <p style={{ fontSize: '0.78rem', marginTop: '0.3rem', color: 'var(--text-muted)' }}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                  </p>
                </div>
                {!item.isRead && (
                  <button
                    className="btn btn-outline"
                    style={{ padding: '0.35rem 0.65rem' }}
                    onClick={() => markNotificationRead(item._id)}
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Notifications;