import { useMemo, useState, useEffect, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import api from '../utils/api';
import { ArrowLeft, Calendar, ChevronDown, Clock3 } from 'lucide-react';
import { getClothImageSrc } from '../utils/visuals';
import { formatINR } from '../utils/currency';

const toDateOnly = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const BookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { toast } = useContext(ToastContext);
  const [cloth, setCloth] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('18:00');
  const [blockedRanges, setBlockedRanges] = useState([]);
  const [isLoadingCloth, setIsLoadingCloth] = useState(true);
  const [isLoadingBlockedDates, setIsLoadingBlockedDates] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchCloth = async () => {
      try {
        const clothRes = await api.get(`/clothes/${id}`);
        setCloth(clothRes.data);
      } catch (err) {
        setError('Failed to load item.');
      } finally {
        setIsLoadingCloth(false);
      }
    };

    const fetchBlockedRanges = async () => {
      try {
        const blockedRes = await api.get(`/bookings/cloth/${id}/blocked`);
        setBlockedRanges(blockedRes.data || []);
      } catch (err) {
        setError('Failed to load unavailable dates.');
      } finally {
        setIsLoadingBlockedDates(false);
      }
    };

    fetchCloth();
    fetchBlockedRanges();
  }, [id]);

  // Returns true if a single date string falls inside any blocked range
  const isDateBlocked = (dateStr) => {
    if (!dateStr) return false;
    const d = toDateOnly(dateStr);
    return blockedRanges.some((range) => {
      return toDateOnly(range.startDate) <= d && d <= toDateOnly(range.endDate);
    });
  };

  // Returns true if the selected start–end range overlaps any blocked range
  const selectedRangeOverlaps = useMemo(() => {
    if (!startDate || !endDate) return false;
    const selectedStart = toDateOnly(startDate);
    const selectedEnd = toDateOnly(endDate);
    return blockedRanges.some((range) => {
      const blockedStart = toDateOnly(range.startDate);
      const blockedEnd = toDateOnly(range.endDate);
      return blockedStart <= selectedEnd && blockedEnd >= selectedStart;
    });
  }, [startDate, endDate, blockedRanges]);

  const todayStr = new Date().toISOString().split('T')[0];

  const days = startDate && endDate
    ? Math.max(1, Math.ceil((toDateOnly(endDate) - toDateOnly(startDate)) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleStartDateChange = (e) => {
    const val = e.target.value;
    setError('');
    setSuccess('');
    if (isDateBlocked(val)) {
      setStartDate('');
      setError('That start date falls within an already-booked period. Please choose another date.');
      return;
    }
    setStartDate(val);
    // Reset end date if it's now before or equal to the new start
    if (endDate && endDate <= val) setEndDate('');
  };

  const handleEndDateChange = (e) => {
    const val = e.target.value;
    setError('');
    setSuccess('');
    if (isDateBlocked(val)) {
      setEndDate('');
      setError('That end date falls within an already-booked period. Please choose another date.');
      return;
    }
    setEndDate(val);
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login first to book an item');
      return;
    }
    setError('');
    setSuccess('');

    if (!startDate || !endDate || days === 0) {
      setError('Please select both start and end dates.');
      return;
    }

    if (selectedRangeOverlaps) {
      setError('Selected dates overlap with an existing booking. Choose another range.');
      return;
    }

    try {
      await api.post('/bookings', {
        clothId: id,
        startDate: `${startDate}T${startTime}:00`,
        endDate: `${endDate}T${endTime}:00`,
      });
      setSuccess('Booking successful! Redirecting to profile...');
      setTimeout(() => navigate('/profile'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    }
  };

  if (isLoadingCloth || !cloth) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;

  const imageUrl = getClothImageSrc(cloth);
  const total = days * cloth.pricePerDay;
  const canConfirm = !!startDate && !!endDate && days > 0 && !selectedRangeOverlaps && cloth.availability;

  return (
    <div className="booking-page">
      <Link to="/browse" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1rem' }}>
        <ArrowLeft size={14} /> Back to Browse
      </Link>

      <section className="booking-layout">
        <div className="glass booking-media-card booking-column-surface">
          <img
            src={imageUrl}
            alt={cloth.title}
            className="booking-media-image"
            onError={(e) => { e.target.src = getClothImageSrc({ title: cloth.title, category: cloth.category }); }}
          />
          <div className="booking-media-footer">
            <span className="booking-media-caption">Premium rental look</span>
            <Link to="/browse" className="booking-media-link">
              View details <ChevronDown size={14} />
            </Link>
          </div>
        </div>

        <aside className="glass booking-panel booking-column-surface">
          <div className="booking-header">
            <h1 className="booking-title">{cloth.title}</h1>
            <div className="booking-price-line">
              <strong>{formatINR(cloth.pricePerDay)}</strong>
              <span>/ day</span>
            </div>
            <p className="booking-subtitle">{cloth.description}</p>
          </div>

          <p className="booking-subtitle booking-subtitle-tight">{cloth.occasion || cloth.category}</p>

          <form className="booking-form" onSubmit={handleBooking}>
            <div className="booking-form-header">
              <div className="booking-form-title-row">
                <div className={`booking-status-dot ${cloth.availability ? 'is-live' : 'is-offline'}`} />
                <Calendar size={18} />
                <span>Select Dates</span>
              </div>
              <p>Choose your rental start and end dates.</p>
            </div>

            {error && <div className="booking-alert booking-alert-error">{error}</div>}
            {success && <div className="booking-alert booking-alert-success">{success}</div>}

            <div className="booking-stack booking-datetime-stack">
              {/* Start date */}
              <div className="booking-datetime-row">
                <div className="booking-datetime-label">Start</div>
                <div className="booking-datetime-fields">
                  <input
                    type="date"
                    className="form-control"
                    value={startDate}
                    min={todayStr}
                    onChange={handleStartDateChange}
                  />
                  <label className="booking-time-field">
                    <span className="booking-sr-label">Start time</span>
                    <Clock3 size={14} />
                    <input
                      type="time"
                      className="form-control booking-time-input"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </label>
                </div>
              </div>

              {/* End date */}
              <div className="booking-datetime-row">
                <div className="booking-datetime-label">End</div>
                <div className="booking-datetime-fields">
                  <input
                    type="date"
                    className="form-control"
                    value={endDate}
                    min={startDate || todayStr}
                    onChange={handleEndDateChange}
                  />
                  <label className="booking-time-field">
                    <span className="booking-sr-label">End time</span>
                    <Clock3 size={14} />
                    <input
                      type="time"
                      className="form-control booking-time-input"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Overlap warning */}
            {selectedRangeOverlaps && (
              <p className="booking-inline-note booking-inline-note-warning">
                The selected date range overlaps with an existing booking. Please choose different dates.
              </p>
            )}

            {/* List booked ranges so users know what to avoid */}
            {!isLoadingBlockedDates && blockedRanges.length > 0 && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <strong>Already booked:</strong>
                <ul style={{ margin: '0.3rem 0 0 1rem', padding: 0 }}>
                  {blockedRanges.map((range, i) => (
                    <li key={i}>
                      {new Date(range.startDate).toLocaleDateString()} – {new Date(range.endDate).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="booking-total-row">
              <span>Total</span>
              <strong>{formatINR(total || 0)}</strong>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full booking-submit-btn"
              disabled={!canConfirm}
            >
              {cloth.availability ? 'Confirm Booking' : 'Currently Unavailable'}
            </button>
          </form>
        </aside>
      </section>
    </div>
  );
};

export default BookingPage;
