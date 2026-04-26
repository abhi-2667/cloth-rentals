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

const BookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { toast } = useContext(ToastContext);
  const calendarPopoverRef = useRef(null);
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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (calendarPopoverRef.current && !calendarPopoverRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener('pointerup', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerup', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

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
  const blockedCalendarRanges = blockedRanges
    .map(toCalendarRange)
    .filter(Boolean);
  const selectedRange = startDate && endDate
    ? { from: toDateOnly(startDate), to: toDateOnly(endDate) }
    : startDate
    ? { from: toDateOnly(startDate) }
    : undefined;
  const days = startDate && endDate
    ? Math.max(1, Math.ceil((toDateOnly(endDate) - toDateOnly(startDate)) / (1000 * 60 * 60 * 24)))
    : 0;
  const startDateLabel = formatDisplayDate(startDate) || 'Select date';
  const endDateLabel = formatDisplayDate(endDate) || 'Select date';

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login first to book an item'); return;
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

              <div className="booking-stack booking-datetime-stack" ref={calendarPopoverRef}>
                <div className="booking-datetime-row">
                  <div className="booking-datetime-label">Start</div>
                  <div className="booking-datetime-fields">
                    <div className="booking-date-popover">
                      <button
                        type="button"
                        className="form-control booking-date-trigger"
                        onClick={() => setIsCalendarOpen((current) => !current)}
                        aria-expanded={isCalendarOpen}
                        aria-haspopup="dialog"
                      >
                        <span>{startDateLabel}</span>
                        <ChevronDown size={14} />
                      </button>

                      {isCalendarOpen && (
                        <div className="booking-calendar-popover">
                          <div className="booking-calendar-shell">
                            <Suspense fallback={<p className="booking-calendar-loading">Loading calendar...</p>}>
                              <DayPicker
                                className="booking-day-picker"
                                mode="range"
                                numberOfMonths={1}
                                selected={selectedRange}
                                onSelect={(range) => {
                                  if (!range) {
                                    setStartDate('');
                                    setEndDate('');
                                    return;
                                  }

                                  // Always update start date if provided
                                  if (range.from) {
                                    setStartDate(range.from.toISOString().split('T')[0]);
                                  }

                                  // First click: only from is set, clear end and keep calendar open
                                  // Second click: both set, update end and close calendar
                                  if (range.to) {
                                    setEndDate(range.to.toISOString().split('T')[0]);
                                    setIsCalendarOpen(false);
                                  } else {
                                    setEndDate('');
                                  }

                                  setError('');
                                  setSuccess('');
                                }}
                                disabled={[{ before: today }, ...blockedCalendarRanges]}
                                modifiers={{ booked: blockedCalendarRanges }}
                                modifiersClassNames={{ booked: 'rdp-day_booked' }}
                              />
                            </Suspense>
                          </div>
                        </div>
                      )}
                    </div>

                    <label className="booking-time-field">
                      <span className="booking-sr-label">Start time</span>
                      <Clock3 size={14} />
                      <input
                        type="time"
                        className="form-control booking-time-input"
                        value={startTime}
                        onChange={(event) => setStartTime(event.target.value)}
                      />
                    </label>
                  </div>
                </div>

                <div className="booking-datetime-row">
                  <div className="booking-datetime-label">End</div>
                  <div className="booking-datetime-fields">
                    <button
                      type="button"
                      className="form-control booking-date-trigger booking-date-trigger-static"
                      onClick={() => setIsCalendarOpen((current) => !current)}
                      aria-expanded={isCalendarOpen}
                      aria-haspopup="dialog"
                    >
                      <span>{endDateLabel}</span>
                      <ChevronDown size={14} />
                    </button>

                    <label className="booking-time-field">
                      <span className="booking-sr-label">End time</span>
                      <Clock3 size={14} />
                      <input
                        type="time"
                        className="form-control booking-time-input"
                        value={endTime}
                        onChange={(event) => setEndTime(event.target.value)}
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
