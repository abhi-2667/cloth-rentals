# cloth-rentals — client

React frontend for the Cloth Rentals application, built with Vite.

## Stack

- React 18
- React Router v6
- Axios
- Lucide React (icons)
- Vite

## Development

```bash
npm install
npm run dev
```

Runs at http://localhost:5173

## Environment Variables

Create a `.env` file in this folder:

```env
VITE_API_URL=http://localhost:5000/api
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## Notes

- All API calls go through `src/utils/api.js` — a single Axios instance that automatically attaches the JWT token to every request
- Auth state is managed globally via `src/context/AuthContext.jsx`
- Images are served from Cloudinary
