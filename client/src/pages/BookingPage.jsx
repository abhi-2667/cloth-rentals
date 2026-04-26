import { lazy, Suspense, useMemo, useState, useEffect, useContext, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import 'react-day-picker/dist/style.css';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import api from '../utils/api';
import { ArrowLeft, Calendar, ChevronDown, Clock3 } from 'lucide-react';
import { getClothImageSrc } from '../utils/visuals';
import { formatINR } from '../utils/currency';

const DayPicker = lazy(() => import('react-day-picker').then((mod) => ({ default: mod.DayPicker })));

const toDateOnly = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const toCalendarRange = (range) => {
  const from = toDateOnly(range.startDate);
  const to = toDateOnly(range.endDate);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  return { from, to };
};

const formatDisplayDate = (value) => {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

// Reusable single-date popover picker
const SingleDatePicker = ({ label, dateValue, onDateChange, disabledDays, bookedRanges, triggerClassName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const selected = dateValue ? toDateOnly(dateValue) : undefined;

  useEffect(() => {
    const handlePointerUp = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div className="booking-date-popover" ref={ref}>
      <button
        type="button"
        className={`form-control booking-date-trigger ${triggerClassName || ''}`}
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <span>{formatDisplayDate(dateValue) || label}</span>
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <div className="booking-calendar-popover">
          <div className="booking-calendar-shell">
            <Suspense fallback={<p className="booking-calendar-loading">Loading calendar...</p>}>
              <DayPicker
                className="booking-day-picker"
                mode="single"
                numberOfMonths={1}
                selected={selected}
                onSelect={(day) => {
                  if (!day) return;
                  onDateChange(day.toISOString().split('T')[0]);
                  setIsOpen(false);
                }}
                disabled={disabledDays}
                modifiers={{ booked: bookedRanges }}
                modifiersClassNames={{ booked: 'rdp-day_booked' }}
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
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

  const today = toDateOnly(new Date());
  const blockedCalendarRanges = blockedRanges.map(toCalendarRange).filter(Boolean);

  const days = startDate && endDate
    ? Math.max(1, Math.ceil((toDateOnly(endDate) - toDateOnly(startDate)) / (1000 * 60 * 60 * 24)))
    : 0;

  // End date picker disables everything before the chosen start date (or today if none)
  const endDisabledDays = [
    { before: startDate ? toDateOnly(startDate) : today },
    ...blockedCalendarRanges
  ];

  const handleStartDateChange = (date) => {
    setStartDate(date);
    setError('');
    setSuccess('');
    // Clear end date if it's now before the new start date
    if (endDate && toDateOnly(date) > toDateOnly(endDate)) {
      setEndDate('');
    }
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
    setError('');
    setSuccess('');
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
        endDate: `${endDate}T${endTime}:00`
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
                <span>Calendar</span>
              </div>
              <p>Choose dates, times, and confirm when ready.</p>
            </div>

            {error && <div className="booking-alert booking-alert-error">{error}</div>}
            {success && <div className="booking-alert booking-alert-success">{success}</div>}

            <div className="booking-stack booking-datetime-stack">
              {/* START DATE ROW */}
              <div className="booking-datetime-row">
                <div className="booking-datetime-label">Start</div>
                <div className="booking-datetime-fields">
                  <SingleDatePicker
                    label="Select date"
                    dateValue={startDate}
                    onDateChange={handleStartDateChange}
                    disabledDays={[{ before: today }, ...blockedCalendarRanges]}
                    bookedRanges={blockedCalendarRanges}
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

              {/* END DATE ROW */}
              <div className="booking-datetime-row">
                <div className="booking-datetime-label">End</div>
                <div className="booking-datetime-fields">
                  <SingleDatePicker
                    label="Select date"
                    dateValue={endDate}
                    onDateChange={handleEndDateChange}
                    disabledDays={endDisabledDays}
                    bookedRanges={blockedCalendarRanges}
                    triggerClassName="booking-date-trigger-static"
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

            {selectedRangeOverlaps && (
              <p className="booking-inline-note booking-inline-note-warning">
                The selected date range is unavailable.
              </p>
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
