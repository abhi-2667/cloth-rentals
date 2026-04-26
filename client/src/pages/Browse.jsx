import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';
import ClothCard from '../components/ClothCard';
import { Search } from 'lucide-react';

const Browse = () => {
  const [clothes, setClothes] = useState([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const initialOccasion =
    searchParams.get('occasion') ||
    searchParams.get('category') ||
    '';

  const [occasionFilter, setOccasionFilter] = useState(initialOccasion);
  const [genderFilter, setGenderFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [sizeFilter, setSizeFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setOccasionFilter(
      params.get('occasion') ||
        params.get('category') ||
        ''
    );
  }, [location.search]);

  useEffect(() => {
    const fetchClothes = async () => {
      try {
        const params = new URLSearchParams();

        if (occasionFilter) params.set('occasion', occasionFilter);
        if (genderFilter) params.set('gender', genderFilter);
        if (availabilityFilter !== 'all')
          params.set('availability', availabilityFilter);
        if (sizeFilter) params.set('size', sizeFilter);
        if (minPrice) params.set('minPrice', minPrice);
        if (maxPrice) params.set('maxPrice', maxPrice);
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);

        const url = params.toString()
          ? `/clothes?${params.toString()}`
          : '/clothes';

        const res = await api.get(url);
        setClothes(res.data);
      } catch (error) {
        console.error('Error fetching clothes', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClothes();
  }, [
    occasionFilter,
    genderFilter,
    availabilityFilter,
    sizeFilter,
    minPrice,
    maxPrice,
    startDate,
    endDate,
  ]);

  const normalizedQuery = searchTerm.trim().toLowerCase();

  const visibleClothes = clothes
    .filter((cloth) => {
      if (!normalizedQuery) return true;

      const haystack = `
        ${cloth.title}
        ${cloth.description}
        ${cloth.category}
        ${cloth.occasion || ''}
        ${cloth.gender || ''}
        ${cloth.size}
      `.toLowerCase();

      return haystack.includes(normalizedQuery);
    })
    .sort((a, b) => {
      if (sortBy === 'priceAsc')
        return a.pricePerDay - b.pricePerDay;

      if (sortBy === 'priceDesc')
        return b.pricePerDay - a.pricePerDay;

      if (sortBy === 'latest')
        return new Date(b.createdAt) - new Date(a.createdAt);

      return 0;
    });

  if (loading)
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        Loading catalog...
      </div>
    );

  return (
    <div>
      {/* HEADER */}
      <div
        style={{
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
            Catalog
          </h1>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.92rem',
            }}
          >
            Filter by gender, occasion, availability, price,
            and date to find event-ready pieces faster.
          </p>
        </div>

        <div className="flex gap-2">
          {['', 'wedding', 'party', 'casual'].map((cat) => (
            <button
              key={cat}
              className={`btn ${
                occasionFilter === cat
                  ? 'btn-primary'
                  : 'btn-outline'
              }`}
              onClick={() => setOccasionFilter(cat)}
              style={{
                padding: '0.5rem 1rem',
                textTransform: 'capitalize',
              }}
            >
              {cat === '' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* SEARCH + SORT */}
      <div
        className="glass"
        style={{
          padding: '1rem',
          marginBottom: '2rem',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '1rem',
        }}
      >
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Search catalog</label>
          <input
            type="text"
            className="form-control"
            placeholder="Search by title, category, size..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Sort</label>
          <select
            className="form-control"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="featured">Featured</option>
            <option value="latest">Newest</option>
            <option value="priceAsc">
              Price: Low to High
            </option>
            <option value="priceDesc">
              Price: High to Low
            </option>
          </select>
        </div>
      </div>

      {/* FILTERS */}
      <div
        className="glass"
        style={{
          padding: '1rem',
          marginBottom: '2rem',
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Gender */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Gender</label>
          <select
            className="form-control"
            value={genderFilter}
            onChange={(e) =>
              setGenderFilter(e.target.value)
            }
          >
            <option value="">All</option>
            <option value="women">Women</option>
            <option value="men">Men</option>
            <option value="unisex">Unisex</option>
          </select>
        </div>

        {/* Availability */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Availability</label>
          <select
            className="form-control"
            value={availabilityFilter}
            onChange={(e) =>
              setAvailabilityFilter(e.target.value)
            }
          >
            <option value="all">All</option>
            <option value="true">
              Currently Available
            </option>
            <option value="false">
              Currently Unavailable
            </option>
          </select>
        </div>

        {/* Size */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Size</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. M"
            value={sizeFilter}
            onChange={(e) =>
              setSizeFilter(e.target.value)
            }
          />
        </div>

        {/* Price */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Min Price (INR)</label>
          <input
            type="number"
            className="form-control"
            placeholder="1000"
            value={minPrice}
            onChange={(e) =>
              setMinPrice(e.target.value)
            }
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Max Price (INR)</label>
          <input
            type="number"
            className="form-control"
            placeholder="5000"
            value={maxPrice}
            onChange={(e) =>
              setMaxPrice(e.target.value)
            }
          />
        </div>

        {/* Dates */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Available From</label>
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) =>
              setStartDate(e.target.value)
            }
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Available Until</label>
          <input
            type="date"
            className="form-control"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) =>
              setEndDate(e.target.value)
            }
          />
        </div>
      </div>

      {/* RESULTS */}
      {visibleClothes.length === 0 ? (
        <div
          className="glass"
          style={{
            padding: '4rem',
            textAlign: 'center',
          }}
        >
          <Search
            size={48}
            style={{
              color: 'var(--text-muted)',
              margin: '0 auto 1rem',
            }}
          />
          <h3>No items found</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Try changing your filters or search term.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '2rem',
          }}
        >
          {visibleClothes.map((cloth) => (
            <ClothCard key={cloth._id} cloth={cloth} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Browse;
