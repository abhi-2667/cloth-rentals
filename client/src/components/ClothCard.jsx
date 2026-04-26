import { Link } from 'react-router-dom';
import { getClothImageSrc } from '../utils/visuals';
import { formatINR } from '../utils/currency';

const ClothCard = ({ cloth }) => {
  const imageUrl = getClothImageSrc(cloth);

  return (
    <div className="glass catalog-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="catalog-card-img-wrap" style={{ background: '#0d0d14' }}>
        <img
          src={imageUrl}
          alt={cloth.title}
          className="catalog-card-image"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center top',
          }}
          onError={(e) => { e.target.src = getClothImageSrc({ title: cloth.title, category: cloth.category }); }}
        />

        <span
          style={{
            position: 'absolute',
            top: '0.8rem',
            left: '0.8rem',
            display: 'inline-block',
            padding: '0.22rem 0.62rem',
            borderRadius: '999px',
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            background: 'rgba(0, 0, 0, 0.45)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          {cloth.category}
        </span>
      </div>

      <div
        style={{
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
            }}
          >
            Sizes: {cloth.size}
          </span>
        </div>

        <h3
          style={{
            fontSize: '1.25rem',
            marginTop: '0.5rem',
            marginBottom: '0.5rem',
            flexGrow: 1,
            letterSpacing: '-0.01em',
          }}
        >
          {cloth.title}
        </h3>

        <div style={{ marginBottom: '0.5rem' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              background: cloth.availability
                ? 'rgba(16, 185, 129, 0.2)'
                : 'rgba(239, 68, 68, 0.2)',
              color: cloth.availability
                ? 'var(--success)'
                : 'var(--danger)',
            }}
          >
            {cloth.availability ? 'Available' : 'Unavailable'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1rem',
          }}
        >
          <span
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
            }}
          >
            {formatINR(cloth.pricePerDay)}
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
              }}
            >
              /day
            </span>
          </span>

          <Link
            to={`/cloth/${cloth._id}`}
            className={`btn ${
              cloth.availability ? 'btn-primary' : 'btn-outline'
            }`}
            style={{
              padding: '0.5rem 1rem',
              pointerEvents: cloth.availability ? 'auto' : 'none',
              opacity: cloth.availability ? 1 : 0.6,
            }}
            aria-disabled={!cloth.availability}
          >
            {cloth.availability ? 'View Details' : 'Not Available'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ClothCard;
