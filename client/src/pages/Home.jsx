import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ShieldCheck, Truck, CalendarDays, IndianRupee,
  CheckCircle2, ArrowUpRight, Star, Sparkles, Users, Package
} from 'lucide-react';
import { getEditorialPanelSrc } from '../utils/visuals';

const HERO_IMG     = 'https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?q=80&w=900&auto=format&fit=crop';
const PARTY_IMG    = 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=900&auto=format&fit=crop';
const OCCASION_WEDDING_IMG = 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=900&auto=format&fit=crop';
const OCCASION_PARTY_IMG   = 'https://images.unsplash.com/photo-1566479179817-c0b5b4b4b3c8?q=80&w=900&auto=format&fit=crop';
const OCCASION_ETHNIC_IMG  = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=900&auto=format&fit=crop';
const OCCASION_FAREWELL_IMG = 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?q=80&w=900&auto=format&fit=crop';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=900&auto=format&fit=crop';

const safeImg = (e) => { e.target.src = FALLBACK_IMG; };

const occasions = [
  {
    name: 'Wedding Functions',
    desc: 'Engagement, pre-wedding, ceremony, and reception wardrobes.',
    tag: 'Most booked',
    img: OCCASION_WEDDING_IMG,
    route: '/browse?category=wedding',
    color: 'rgba(212, 175, 55, 0.7)',
  },
  {
    name: 'Cocktail & Party',
    desc: 'Bold fits for nightlife, clubs, and celebratory dinners.',
    tag: 'Evening edit',
    img: OCCASION_PARTY_IMG,
    route: '/browse?category=party',
    color: 'rgba(139, 92, 246, 0.65)',
  },
  {
    name: 'Festive & Family',
    desc: 'Diwali, Eid, Navratri, engagement, and puja picks.',
    tag: 'Seasonal picks',
    img: OCCASION_ETHNIC_IMG,
    route: '/browse?category=casual',
    color: 'rgba(234, 88, 12, 0.65)',
  },
  {
    name: 'College Farewell',
    desc: 'Standout graduation and farewell outfits at student-friendly prices.',
    tag: 'Budget smart',
    img: OCCASION_FAREWELL_IMG,
    route: '/browse?category=casual',
    color: 'rgba(16, 185, 129, 0.65)',
  },
];

const steps = [
  {
    num: '01',
    icon: <CalendarDays size={22} />,
    title: 'Pick your date',
    desc: 'Choose your outfit and rental period. Real-time availability checks prevent double bookings.',
  },
  {
    num: '02',
    icon: <IndianRupee size={22} />,
    title: 'Pay less, wear premium',
    desc: 'Wedding and party fashion at a fraction of retail spend — from ₹1,499/day.',
  },
  {
    num: '03',
    icon: <CheckCircle2 size={22} />,
    title: 'Wear & return',
    desc: 'Track booking confirmation, dispatch, and return completion right from your profile.',
  },
];

const stats = [
  { value: 'Curated', label: 'Wedding, party, and festive edits', icon: <Package size={18} /> },
  { value: 'Flexible', label: 'Transparent day-wise rental pricing', icon: <IndianRupee size={18} /> },
  { value: 'Fast', label: 'Quick prep and dispatch support', icon: <Truck size={18} /> },
  { value: '4.9★', label: 'Avg. renter rating', icon: <Star size={18} /> },
];

const testimonials = [
  {
    quote: 'Booked my cousin\'s wedding outfit in minutes. The date availability check made it stress-free and the piece was stunning.',
    name: 'Priya M.',
    location: 'Mumbai',
  },
  {
    quote: 'Finally a platform that actually has stylish ethnic wear at prices that make sense. Wore a gorgeous sherwani and saved ₹18,000.',
    name: 'Arjun K.',
    location: 'Delhi',
  },
  {
    quote: 'The quality was exactly as described. Returned it the next day — no hassle. Will 100% use again for Navratri.',
    name: 'Sneha R.',
    location: 'Ahmedabad',
  },
];

const Home = () => {
  const navigate = useNavigate();
  const [featuredOccasion, ...secondaryOccasions] = occasions;

  return (
    <div className="home-page">

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="home-hero fade-up">
        <div className="home-hero-left">
          <p className="home-eyebrow">India-first occasion rental platform</p>

          <h1 className="home-hero-title">
            From weddings<br />
            to festive nights,<br />
            <span className="home-hero-accent">rent your look.</span>
          </h1>

          <p className="home-hero-sub">
            Lehengas, sherwanis, cocktail gowns, and festive kurtas — curated event-wear without the full purchase cost.
          </p>

          <div className="home-hero-chips">
            <span className="home-chip"><ShieldCheck size={13} /> Quality-checked</span>
            <span className="home-chip"><CalendarDays size={13} /> Date-safe availability</span>
            <span className="home-chip"><IndianRupee size={13} /> Transparent pricing</span>
          </div>

          <div className="home-hero-ctas">
            <button onClick={() => navigate('/browse')} className="btn btn-primary home-cta-primary">
              Explore Outfits <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate('/browse?category=wedding')} className="btn btn-outline">
              Wedding Edit
            </button>
          </div>
        </div>

        <div className="home-hero-right">
          <div className="home-hero-img-main">
            <img src={HERO_IMG} alt="Bridal collection lookbook" onError={safeImg} />
            <div className="home-hero-img-badge">
              <Sparkles size={14} style={{ color: 'var(--primary-color)' }} />
              <span>Bridal & Wedding Edit</span>
            </div>
          </div>

          <div className="home-hero-img-secondary">
            <img src={PARTY_IMG} alt="Festive cocktail collection" onError={safeImg} />
            <div className="home-hero-img-badge home-hero-img-badge-sm">
              <span>Cocktail Drop</span>
            </div>
          </div>

          <div className="home-hero-stat-card glass">
            <p className="home-hero-stat-num">500<span>+</span></p>
            <p className="home-hero-stat-label">event-ready pieces</p>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ───────────────────────────────────── */}
      <div className="home-stats-strip glass fade-up-delay">
        {stats.map((s) => (
          <div key={s.value} className="home-stat-item">
            <div className="home-stat-icon">{s.icon}</div>
            <div>
              <p className="home-stat-value">{s.value}</p>
              <p className="home-stat-label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── OCCASIONS ─────────────────────────────────────── */}
      <section className="home-section">
        <div className="home-section-header">
          <p className="home-eyebrow">Browse by occasion</p>
          <h2 className="home-section-title">Browse by Occasion</h2>
          <p className="home-section-sub">Pick your event lane and jump to curated looks built for that moment.</p>
        </div>

        <div className="home-occasions-shell">
          <button
            className="home-occasion-feature"
            onClick={() => navigate(featuredOccasion.route)}
          >
            <img src={featuredOccasion.img} alt={featuredOccasion.name} className="home-occasion-img" onError={safeImg} />
            <div className="home-occasion-overlay" style={{ background: `linear-gradient(155deg, rgba(4,8,18,0.28) 6%, ${featuredOccasion.color} 75%, rgba(4,8,18,0.92) 100%)` }} />
            <div className="home-occasion-content home-occasion-feature-content">
              <span className="home-occasion-tag">{featuredOccasion.tag}</span>
              <h3 className="home-occasion-name">{featuredOccasion.name}</h3>
              <p className="home-occasion-desc">{featuredOccasion.desc}</p>
              <span className="home-occasion-cta">Explore collection <ArrowUpRight size={14} /></span>
            </div>
          </button>

          <div className="home-occasions-grid">
          {secondaryOccasions.map((item) => (
            <button
              key={item.name}
              className="home-occasion-card"
              onClick={() => navigate(item.route)}
            >
              <img src={item.img} alt={item.name} className="home-occasion-img" onError={safeImg} />
              <div className="home-occasion-overlay" style={{ background: `linear-gradient(to top, ${item.color} 2%, rgba(0,0,0,0.16) 62%, transparent 100%)` }} />
              <div className="home-occasion-content">
                <span className="home-occasion-tag">{item.tag}</span>
                <h3 className="home-occasion-name">{item.name}</h3>
                <p className="home-occasion-desc">{item.desc}</p>
                <span className="home-occasion-cta">Explore now <ArrowUpRight size={14} /></span>
              </div>
            </button>
          ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section className="home-section">
        <div className="home-section-header">
          <p className="home-eyebrow">Simple process</p>
          <h2 className="home-section-title">How Renting Works</h2>
          <p className="home-section-sub">Three steps from browse to celebration.</p>
        </div>

        <div className="home-steps-grid">
          {steps.map((step, i) => (
            <article key={step.num} className="home-step-card glass">
              <div className="home-step-num">{step.num}</div>
              <div className="home-step-icon-wrap">
                {step.icon}
              </div>
              <h3 className="home-step-title">{step.title}</h3>
              <p className="home-step-desc">{step.desc}</p>
              {i < steps.length - 1 && <div className="home-step-connector" />}
            </article>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────── */}
      <section className="home-section">
        <div className="home-section-header">
          <p className="home-eyebrow">What renters say</p>
          <h2 className="home-section-title">Trusted by Hundreds<br />Across India</h2>
        </div>

        <div className="home-testimonials-grid">
          {testimonials.map((t) => (
            <div key={t.name} className="home-testimonial glass">
              <p className="home-testimonial-quote-mark">"</p>
              <p className="home-testimonial-text">{t.quote}</p>
              <div className="home-testimonial-footer">
                <div className="home-testimonial-avatar">
                  <Users size={16} />
                </div>
                <div>
                  <p className="home-testimonial-name">{t.name}</p>
                  <p className="home-testimonial-location">{t.location}</p>
                </div>
                <div className="home-testimonial-stars">
                  {'★★★★★'.split('').map((s, i) => <span key={i}>{s}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────── */}
      <section className="home-cta-banner glass">
        <div className="home-cta-glow" />
        <div className="home-cta-content">
          <p className="home-eyebrow" style={{ color: 'var(--primary-color)' }}>Ready to rent?</p>
          <h2 className="home-cta-title">Your perfect occasion look<br />is one click away.</h2>
          <p className="home-cta-sub">Join hundreds of renters discovering premium fashion without the premium price tag.</p>
          <div className="home-cta-btns">
            <button onClick={() => navigate('/browse')} className="btn btn-primary home-cta-primary">
              Browse the Catalog <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate('/signin')} className="btn btn-outline">
              Create Account
            </button>
          </div>
        </div>
        <div className="home-cta-trust">
          <span><ShieldCheck size={15} /> Verified bookings</span>
          <span><Truck size={15} /> Hassle-free returns</span>
          <span><Sparkles size={15} /> Curated fashion</span>
        </div>
      </section>

    </div>
  );
};

export default Home;
