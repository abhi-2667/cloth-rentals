# Cloth Rental App - Project Documentation

## 1. Introduction
The Cloth Rental App is a web-based platform that allows users to rent clothes for special occasions instead of purchasing expensive outfits. The system offers an easy and efficient way to browse, select, and book clothing items online while helping businesses manage inventory and rentals digitally.

## 2. Description
The application enables users to:
- Explore a wide variety of clothing items
- Select outfits by category (wedding, party, casual, etc.)
- Check availability for specific dates
- Rent items for a defined period

The system enables administrators to:
- Manage clothing inventory
- Track rentals and returns
- Monitor user activity

## 3. Problem Statement
Many users prefer renting clothes for special occasions instead of buying expensive outfits. However, there are limited digital platforms that allow users to easily browse, check availability, and rent clothing items efficiently.

## 4. Scenario
### User Journey
1. The user logs into the platform.
2. The user browses available clothing categories.
3. The user selects an outfit and checks date availability.
4. The user books the outfit.
5. The user receives booking confirmation.
6. The user returns the outfit after usage.

### Admin Journey
- Add new clothing items
- Track bookings
- Update availability after return

## 5. Architecture
### Detailed Architecture Layers
1. User and Frontend (React)
- Users interact with the React application.
- Main actions: login/signup, browse clothes, book outfits, view profile/dashboard.
- Frontend communicates with backend via REST APIs over HTTP.

2. API Gateway (Node.js + Express)
- Entry point of the backend.
- Receives requests from frontend.
- Routes requests to core modules: authentication, clothes, bookings, and users.

3. Authentication Module
- Handles signup/login.
- Generates and verifies JWT tokens.
- Hashes passwords securely.
- Enforces protected route access.

4. Application APIs
- /auth: login and register
- /users: profile and account operations
- /clothes: clothing inventory and catalog
- /bookings: booking lifecycle and return flow

5. Business Logic Layer
- Booking management
- Availability check (date overlap logic)
- Price calculation
- Inventory availability updates

6. External Services (Optional/Extended)
- Image upload and storage (Cloudinary or AWS S3)
- Payment integrations (Razorpay or Stripe)
- Email/SMS notifications

7. Data Access Layer
- Uses models to interact with MongoDB.
- Performs data validation, query handling, and relationship mapping.

8. Database (MongoDB)
- Stores users, clothes, bookings, and optional payment records.

### High-Level Architecture (3-Tier + Extended)
Frontend (React)
-> API Layer (Express REST APIs)
-> Backend (Node.js Business Logic)
-> Database (MongoDB)

Additional components:
- Authentication Service (JWT)
- File Storage (Cloudinary or AWS S3)
- Payment Gateway (optional: Razorpay or Stripe)
- Notification Service (Email/SMS)

## 6. Project Flow (System Flow)
User -> Register/Login -> Browse Clothes -> Select Item -> Check Availability -> Book Item -> Payment (optional) -> Confirmation

Admin -> Add/Edit/Delete Clothes -> Manage Bookings -> Update Inventory

## 7. User Flow
1. User creates an account or logs in.
2. User browses catalog with category filters.
3. User selects rental dates and checks availability.
4. User confirms booking and views booking status.
5. User returns outfit and booking status is updated.

## 8. Pre-Requisites
Students should have:
- Basic knowledge of JavaScript
- Understanding of Node.js and Express
- Basics of MongoDB
- Knowledge of REST APIs
- Basic frontend knowledge (React recommended)

## 9. Required Technologies
### Frontend
- React.js
- HTML, CSS, JavaScript

### Backend
- Node.js
- Express.js

### Database
- MongoDB with Mongoose

### Other Tools
- JWT for authentication
- bcrypt for password hashing
- Cloudinary or AWS S3 for image upload
- Postman for API testing

## 10. Suggested Database Collections
### Users
- name
- email
- password
- role (user/admin)

### Clothes
- title
- description
- category
- size
- pricePerDay
- availability
- imageUrl

### Bookings
- userId
- clothId
- startDate
- endDate
- totalPrice
- status (booked/returned)

### Payments (Optional)
- userId
- bookingId
- amount
- paymentStatus

## 11. Key Features
- User authentication (login/register)
- Clothing catalog browsing
- Filter/search support
- Rental booking system
- Availability management
- Admin dashboard
- Booking history
- Return tracking
- Admin approval workflow for new users
- Magic-link based login support
- Security hardening with CORS allowlist and API rate limiting

## 12. Implemented Security and Validation Notes
- JWT-based protected routes for authenticated access.
- Role-based authorization for admin-only operations.
- Approval-gated access: users pending approval cannot use protected business endpoints.
- CORS allowlist with production-safe origin validation.
- Global and auth-specific rate limiting to reduce abuse.
- Request payload validation for auth, bookings, users, and inventory update paths.

## 13. Availability Policy (Finalized)
- `availability` field is a global admin control switch.
- When `availability=false`, the item is globally unavailable regardless of date.
- When `availability=true`, bookings are still blocked for overlapping date ranges.
- Date-overlap logic remains the booking-level enforcement (`existingStart <= newEnd && existingEnd >= newStart`).

## 14. Optional Advanced Features
- Online payment integration (Razorpay/Stripe)
- Real-time availability calendar
- Ratings and reviews
- Email/SMS notifications
- Admin analytics dashboard
- Wishlist
- AI-based recommendations

## 15. Learning Outcomes
By completing this project, students will learn:
- Full stack development with MERN
- REST API design
- Authentication with JWT
- MongoDB schema design
- Real-world booking logic implementation
- Date handling and availability checks
- File upload management
- Role-based access control (admin/user)
