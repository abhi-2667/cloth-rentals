import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { PlusCircle, Package, CheckCircle, Users, Shield, BarChart3 } from 'lucide-react';
import { formatINR } from '../utils/currency';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const { toast } = useContext(ToastContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [clothes, setClothes] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('bookings'); // bookings, inventory, addItems, users, activity
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [activitySummary, setActivitySummary] = useState({ metrics: null, topRenters: [], recentEvents: [] });
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [updatingApprovalId, setUpdatingApprovalId] = useState(null);
  const [highlightedUserId, setHighlightedUserId] = useState('');
  const [bookingFilter, setBookingFilter] = useState('booked');
  const [userFilter, setUserFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    title: '', description: '', category: '', size: '', pricePerDay: ''
  });
  
  const [formData, setFormData] = useState({
    title: '', description: '', category: '', size: '', pricePerDay: '', image: null
  });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    fetchBookings();
    fetchClothes();
    fetchUsers();
    fetchActivitySummary();
  }, [isAdmin]);

  useEffect(() => {
    const approvalUserId = searchParams.get('approvalUserId');
    if (approvalUserId) {
      setActiveTab('users');
      setHighlightedUserId(approvalUserId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!highlightedUserId || activeTab !== 'users') {
      return;
    }

    const element = document.getElementById(`approval-row-${highlightedUserId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedUserId, activeTab, users]);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings');
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClothes = async () => {
    try {
      const res = await api.get('/clothes');
      setClothes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchActivitySummary = async () => {
    setIsLoadingActivity(true);
    try {
      const res = await api.get('/users/activity-summary');
      setActivitySummary(res.data || { metrics: null, topRenters: [], recentEvents: [] });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const handleReturn = async (id) => {
    try {
      await api.put(`/bookings/${id}/return`);
      fetchBookings();
      toast.success('Item marked as returned');
    } catch (err) {
      toast.error('Failed to mark as returned');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    
    try {
      await api.post('/clothes', data, { headers: { 'Content-Type': 'multipart/form-data' }});
      toast.success('Item added successfully');
      setFormData({ title: '', description: '', category: '', size: '', pricePerDay: '', image: null });
      fetchClothes();
    } catch (err) {
      toast.error('Failed to add item');
    }
  };

  const startEdit = (cloth) => {
    setEditingId(cloth._id);
    setEditData({
      title: cloth.title,
      description: cloth.description,
      category: cloth.category,
      size: cloth.size,
      pricePerDay: cloth.pricePerDay,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ title: '', description: '', category: '', size: '', pricePerDay: '' });
  };

  const saveEdit = async (clothId) => {
    try {
      await api.put(`/clothes/${clothId}`, editData);
      setEditingId(null);
      fetchClothes();
      toast.success('Item updated');
    } catch (err) {
      toast.error('Failed to update item');
    }
  };

  const deleteItem = async (clothId) => {
    const confirmed = window.confirm('Delete this item from inventory?');
    if (!confirmed) return;

    try {
      await api.delete(`/clothes/${clothId}`);
      fetchClothes();
      toast.success('Item deleted');
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

  const toggleAvailability = async (cloth) => {
    try {
      await api.put(`/clothes/${cloth._id}`, {
        title: cloth.title,
        description: cloth.description,
        category: cloth.category,
        size: cloth.size,
        pricePerDay: cloth.pricePerDay,
        availability: !cloth.availability,
      });
      fetchClothes();
      toast.success(cloth.availability ? 'Item set to unavailable' : 'Item set to available');
    } catch (err) {
      toast.error('Failed to update availability');
    }
  };

  const handleRoleChange = async (targetUser, newRole) => {
    if (targetUser.role === newRole) return;

    const confirmed = window.confirm(`Change role for ${targetUser.email} to ${newRole}?`);
    if (!confirmed) return;

    setUpdatingUserId(targetUser.id || targetUser._id);
    try {
      await api.put(`/users/${targetUser.id || targetUser._id}/role`, { role: newRole });
      fetchUsers();
      toast.success(`User role updated to ${newRole}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleApprovalChange = async (targetUser, approvalStatus) => {
    if ((targetUser.approvalStatus || 'approved') === approvalStatus) return;

    const confirmed = window.confirm(`Set approval status for ${targetUser.email} to ${approvalStatus}?`);
    if (!confirmed) return;

    const userId = targetUser.id || targetUser._id;
    setUpdatingApprovalId(userId);
    try {
      await api.put(`/users/${userId}/approval`, { approvalStatus });
      fetchUsers();
      toast.success(`User marked as ${approvalStatus}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update approval status');
    } finally {
      setUpdatingApprovalId(null);
    }
  };

  if (!user) {
    return (
      <div className="glass" style={{ padding: '2rem', maxWidth: '700px', margin: '1rem auto' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Admin Area</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Please sign in with an admin account to continue.</p>
        <Link to="/signin" className="btn btn-primary">Go to Sign In</Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="glass" style={{ padding: '2rem', maxWidth: '760px', margin: '1rem auto' }}>
        <p style={{ color: 'var(--accent-color)', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Restricted</p>
        <h2 style={{ marginBottom: '0.55rem' }}>Admin Access Required</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          This page exists, but your current account role is <strong>{user.role}</strong>.
          Ask an existing admin to promote your account.
        </p>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <Link to="/profile" className="btn btn-outline">Back to Profile</Link>
          <button onClick={() => navigate('/')} className="btn btn-primary">Go Home</button>
        </div>
      </div>
    );
  }

  const openBookings = bookings.filter((booking) => booking.status === 'booked').length;
  const availableItems = clothes.filter((cloth) => cloth.availability).length;
  const pendingApprovals = users.filter((u) => (u.approvalStatus || 'approved') === 'pending').length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueBookings = bookings.filter((booking) => booking.status === 'booked' && new Date(booking.endDate) < today).length;
  const lowAvailabilityItems = clothes.filter((cloth) => !cloth.availability);

  const filteredBookings = bookings.filter((booking) => {
    if (bookingFilter === 'all') return true;
    if (bookingFilter === 'overdue') {
      return booking.status === 'booked' && new Date(booking.endDate) < today;
    }
    return booking.status === bookingFilter;
  });

  const filteredUsers = users.filter((u) => {
    if (userFilter === 'all') return true;
    if (userFilter === 'pending') return (u.approvalStatus || 'approved') === 'pending';
    return true;
  });

  return (
    <div>
      <section className="glass" style={{ padding: '1.4rem', marginBottom: '1.2rem' }}>
        <p style={{ color: 'var(--accent-color)', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Operations Console</p>
        <h1 style={{ fontSize: '2.35rem', letterSpacing: '-0.03em' }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '0.85rem' }}>Track rentals and manage inventory from one control surface.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.7rem' }}>
          <article className="glass" style={{ padding: '0.8rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Total Bookings</p>
            <h3 style={{ marginTop: '0.25rem' }}>{bookings.length}</h3>
          </article>
          <article className="glass" style={{ padding: '0.8rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Open Rentals</p>
            <h3 style={{ marginTop: '0.25rem' }}>{openBookings}</h3>
          </article>
          <article className="glass" style={{ padding: '0.8rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Inventory Items</p>
            <h3 style={{ marginTop: '0.25rem' }}>{clothes.length}</h3>
          </article>
          <article className="glass" style={{ padding: '0.8rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Currently Available</p>
            <h3 style={{ marginTop: '0.25rem' }}>{availableItems}</h3>
          </article>
          <article className="glass" style={{ padding: '0.8rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Pending Approvals</p>
            <h3 style={{ marginTop: '0.25rem' }}>{pendingApprovals}</h3>
          </article>
          <article className="glass" style={{ padding: '0.8rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Overdue Returns</p>
            <h3 style={{ marginTop: '0.25rem', color: overdueBookings > 0 ? 'var(--danger)' : 'var(--text-main)' }}>{overdueBookings}</h3>
          </article>
        </div>
      </section>
      
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
        <button 
          className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('bookings')}
        ><Package /> Manage Bookings</button>
        <button
          className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('inventory')}
        >Inventory</button>
        <button 
          className={`btn ${activeTab === 'addItems' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('addItems')}
        ><PlusCircle /> Add Inventory</button>
        <button
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('users')}
        ><Users size={18} /> Manage Users</button>
        <button
          className={`btn ${activeTab === 'activity' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('activity')}
        ><BarChart3 size={18} /> User Activity</button>
      </div>

      {activeTab === 'activity' && (
        <div className="glass" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>User Activity Summary</h2>

          {isLoadingActivity ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading activity metrics...</p>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.7rem', marginBottom: '1.2rem' }}>
                <article className="glass" style={{ padding: '0.8rem' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Recent Signups (14d)</p>
                  <h3 style={{ marginTop: '0.25rem' }}>{activitySummary.metrics?.recentSignups || 0}</h3>
                </article>
                <article className="glass" style={{ padding: '0.8rem' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Recent Bookings (14d)</p>
                  <h3 style={{ marginTop: '0.25rem' }}>{activitySummary.metrics?.recentBookings || 0}</h3>
                </article>
                <article className="glass" style={{ padding: '0.8rem' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Pending Approvals</p>
                  <h3 style={{ marginTop: '0.25rem' }}>{activitySummary.metrics?.pendingApprovals || 0}</h3>
                </article>
                <article className="glass" style={{ padding: '0.8rem' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Active Renters (30d)</p>
                  <h3 style={{ marginTop: '0.25rem' }}>{activitySummary.metrics?.activeRenters30d || 0}</h3>
                </article>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="glass" style={{ padding: '1rem' }}>
                  <h3 style={{ marginBottom: '0.8rem' }}>Top Renters</h3>
                  {activitySummary.topRenters?.length ? (
                    <div style={{ display: 'grid', gap: '0.6rem' }}>
                      {activitySummary.topRenters.map((renter) => (
                        <div key={renter.userId} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.45rem' }}>
                          <div>
                            <strong>{renter.userName || 'User'}</strong>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{renter.bookingsCount} bookings</p>
                          </div>
                          <strong>{formatINR(renter.totalSpent || 0)}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>No renter activity yet.</p>
                  )}
                </div>

                <div className="glass" style={{ padding: '1rem' }}>
                  <h3 style={{ marginBottom: '0.8rem' }}>Recent Events</h3>
                  {activitySummary.recentEvents?.length ? (
                    <div style={{ display: 'grid', gap: '0.6rem' }}>
                      {activitySummary.recentEvents.map((event) => (
                        <div key={event.id} style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.45rem' }}>
                          <strong style={{ textTransform: 'capitalize' }}>{event.type.replace('_', ' ')}</strong>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '0.1rem' }}>{event.message}</p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>{new Date(event.timestamp).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>No recent events.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="glass" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <h2>All Bookings</h2>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              <button className={`btn ${bookingFilter === 'booked' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setBookingFilter('booked')}>Booked</button>
              <button className={`btn ${bookingFilter === 'return_requested' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setBookingFilter('return_requested')}>Return Requested</button>
              <button className={`btn ${bookingFilter === 'returned' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setBookingFilter('returned')}>Returned</button>
              <button className={`btn ${bookingFilter === 'overdue' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setBookingFilter('overdue')}>Overdue</button>
              <button className={`btn ${bookingFilter === 'all' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setBookingFilter('all')}>All</button>
            </div>
          </div>

          {bookingFilter === 'overdue' && (
            <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Showing bookings past end date that are not marked returned.</p>
          )}

          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '760px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '1rem 0' }}>Item</th>
                <th>User</th>
                <th>Dates</th>
                <th>Total</th>
                <th>Contact & Address</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(b => (
                <tr key={b._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '1rem 0' }}>{b.clothId?.title || 'Unknown'}</td>
                  <td>{b.userId?.name || 'Unknown'} ({b.userId?.email || ''})</td>
                  <td>{new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}</td>
                  <td>{formatINR(b.totalPrice)}</td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>{b.userId?.phone || 'No phone'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '200px' }}>{b.userId?.address || 'No address'}</div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem',
                      background: b.status === 'returned' ? 'rgba(16, 185, 129, 0.2)' : b.status === 'cancelled' ? 'rgba(248, 113, 113, 0.18)' : b.status === 'return_requested' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(199, 160, 55, 0.2)',
                      color: b.status === 'returned' ? 'var(--success)' : b.status === 'cancelled' ? 'var(--danger)' : b.status === 'return_requested' ? '#f59e0b' : 'var(--primary-color)'
                    }}>{b.status.replace('_', ' ').toUpperCase()}</span>
                  </td>
                  <td>
                    {(b.status === 'booked' || b.status === 'return_requested') && (
                      <button onClick={() => handleReturn(b._id)} className="btn" style={{ background: 'var(--success)', color: 'white', padding: '0.5rem', fontSize: '0.8rem' }}>
                        <CheckCircle size={16} /> Mark Returned
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {filteredBookings.length === 0 && (
            <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>No bookings found for this filter.</p>
          )}
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="glass" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Inventory Management</h2>

          {lowAvailabilityItems.length > 0 && (
            <div style={{ marginBottom: '1rem', border: '1px solid rgba(239, 68, 68, 0.35)', background: 'rgba(239, 68, 68, 0.12)', borderRadius: '10px', padding: '0.8rem' }}>
              <strong style={{ color: '#ffd8d8' }}>Low availability alert:</strong>
              <span style={{ marginLeft: '0.35rem', color: '#ffd8d8' }}>{lowAvailabilityItems.length} item(s) currently unavailable.</span>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                {lowAvailabilityItems.slice(0, 4).map((item) => item.title).join(', ')}{lowAvailabilityItems.length > 4 ? '...' : ''}
              </p>
            </div>
          )}

          <div style={{ display: 'grid', gap: '1rem' }}>
            {clothes.map((cloth) => (
              <div key={cloth._id} style={{ border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1rem' }}>
                {editingId === cloth._id ? (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <input type="text" className="form-control" value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} />
                    <textarea className="form-control" rows="2" value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })}></textarea>
                    <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: '1fr 1fr 1fr' }}>
                      <select className="form-control" value={editData.category} onChange={(e) => setEditData({ ...editData, category: e.target.value })}>
                        <option value="wedding">Wedding</option>
                        <option value="party">Party</option>
                        <option value="casual">Casual</option>
                      </select>
                      <input type="text" className="form-control" value={editData.size} onChange={(e) => setEditData({ ...editData, size: e.target.value })} />
                      <input type="number" className="form-control" value={editData.pricePerDay} onChange={(e) => setEditData({ ...editData, pricePerDay: e.target.value })} />
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-primary" onClick={() => saveEdit(cloth._id)}>Save</button>
                      <button className="btn btn-outline" onClick={cancelEdit}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ marginBottom: '0.3rem' }}>{cloth.title}</h3>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{cloth.description}</p>
                      <p style={{ margin: 0 }}>
                        <strong>{cloth.category}</strong> | Size: {cloth.size} | {formatINR(cloth.pricePerDay)}/day
                      </p>
                      <span style={{
                        display: 'inline-block',
                        marginTop: '0.5rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        background: cloth.availability ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: cloth.availability ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {cloth.availability ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-outline" onClick={() => toggleAvailability(cloth)}>
                        {cloth.availability ? 'Set Unavailable' : 'Set Available'}
                      </button>
                      <button className="btn btn-primary" onClick={() => startEdit(cloth)}>Edit</button>
                      <button className="btn" style={{ background: 'var(--danger)', color: 'white' }} onClick={() => deleteItem(cloth._id)}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {clothes.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No inventory items found.</p>}
          </div>
        </div>
      )}

      {activeTab === 'addItems' && (
        <div className="glass" style={{ padding: '2rem', maxWidth: '600px' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Add New Clothing Item</h2>
          <form onSubmit={handleAddItem}>
            <div className="form-group">
              <label>Title</label>
              <input type="text" className="form-control" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required></textarea>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Category</label>
                <select className="form-control" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required>
                  <option value="">Select Category</option>
                  <option value="wedding">Wedding</option>
                  <option value="party">Party</option>
                  <option value="casual">Casual</option>
                </select>
              </div>
              <div className="form-group">
                <label>Size</label>
                <input type="text" className="form-control" placeholder="S, M, L, XL" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} required />
              </div>
            </div>
            <div className="form-group">
              <label>Price Per Day (INR)</label>
              <input type="number" className="form-control" value={formData.pricePerDay} onChange={e => setFormData({...formData, pricePerDay: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Item Image</label>
              <input type="file" className="form-control" accept="image/*" onChange={e => setFormData({...formData, image: e.target.files[0]})} required />
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '1rem' }}>Upload Item to Inventory</button>
          </form>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="glass" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <h2>User Management</h2>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              <button className={`btn ${userFilter === 'pending' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setUserFilter('pending')}>Pending ({pendingApprovals})</button>
              <button className={`btn ${userFilter === 'all' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setUserFilter('all')}>All Users</button>
            </div>
          </div>
          {isLoadingUsers ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading users...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '760px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '1rem 0' }}>Name</th>
                    <th>Email</th>
                    <th>Joined</th>
                    <th>Contact/Address</th>
                    <th>Role</th>
                    <th>Approval</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const userId = u.id || u._id;
                    const isCurrentUser = userId === user?.id;
                    const isBusy = updatingUserId === userId;

                    return (
                      <tr
                        id={`approval-row-${userId}`}
                        key={userId}
                        style={{
                          borderBottom: '1px solid var(--glass-border)',
                          background: highlightedUserId === userId ? 'rgba(199, 160, 55, 0.12)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '1rem 0' }}>{u.name || '-'}</td>
                        <td>{u.email}</td>
                        <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                        <td>
                          <div style={{ fontSize: '0.85rem' }}>{u.phone || 'No phone'}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '250px' }}>{u.address || 'No address'}</div>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.22rem 0.6rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            background: u.role === 'admin' ? 'rgba(45, 139, 131, 0.2)' : 'rgba(120, 135, 151, 0.2)',
                            color: u.role === 'admin' ? 'var(--success)' : 'var(--text-muted)'
                          }}>
                            {u.role === 'admin' && <Shield size={14} />}
                            {u.role?.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.22rem 0.6rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            background: (u.approvalStatus || 'approved') === 'approved'
                              ? 'rgba(16, 185, 129, 0.2)'
                              : (u.approvalStatus || 'approved') === 'rejected'
                                ? 'rgba(239, 68, 68, 0.2)'
                                : 'rgba(199, 160, 55, 0.2)',
                            color: (u.approvalStatus || 'approved') === 'approved'
                              ? 'var(--success)'
                              : (u.approvalStatus || 'approved') === 'rejected'
                                ? 'var(--danger)'
                                : 'var(--primary-color)'
                          }}>
                            {(u.approvalStatus || 'approved').toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                            {u.role !== 'admin' ? (
                              <button
                                className="btn btn-primary"
                                onClick={() => handleRoleChange(u, 'admin')}
                                disabled={isBusy}
                              >
                                Make Admin
                              </button>
                            ) : (
                              <button
                                className="btn btn-outline"
                                onClick={() => handleRoleChange(u, 'user')}
                                disabled={isBusy || isCurrentUser}
                                title={isCurrentUser ? 'You cannot remove your own admin role' : 'Demote to user'}
                              >
                                Make User
                              </button>
                            )}
                            {(u.approvalStatus || 'approved') !== 'approved' && (
                              <button
                                className="btn btn-primary"
                                onClick={() => handleApprovalChange(u, 'approved')}
                                disabled={isBusy || updatingApprovalId === (u.id || u._id)}
                              >
                                Approve
                              </button>
                            )}
                            {(u.approvalStatus || 'approved') !== 'rejected' && (
                              <button
                                className="btn btn-outline"
                                onClick={() => handleApprovalChange(u, 'rejected')}
                                disabled={isBusy || updatingApprovalId === (u.id || u._id) || (u.id || u._id) === user?.id}
                                title={(u.id || u._id) === user?.id ? 'You cannot change your own approval status' : 'Reject account'}
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!isLoadingUsers && filteredUsers.length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>No users found for this filter.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
