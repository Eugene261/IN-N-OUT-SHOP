# IN-N-OUT E-Commerce Platform

A modern, full-stack e-commerce platform built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

- **User Authentication**: Secure login and registration system
- **Product Management**: Browse, search, and filter products
- **Shopping Cart**: Add products to cart, update quantities, and checkout
- **Payment Integration**: Secure payment processing with Paystack
- **Order Management**: Track and manage orders
- **Admin Dashboard**: Manage products, orders, and users
- **Super Admin Controls**: Advanced administrative capabilities
- **Responsive Design**: Mobile-friendly interface
- **Wishlist**: Save products for later
- **Featured Collections**: Showcase special product collections

## Tech Stack

### Frontend
- React
- Redux Toolkit for state management
- React Router for navigation
- Tailwind CSS for styling
- Framer Motion for animations
- Axios for API requests

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Multer for file uploads
- Cloudinary for image storage

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/IN-N-OUT-SHOP.git
cd IN-N-OUT-SHOP
```

2. Install server dependencies
```bash
cd server
npm install
```

3. Set up server environment variables
```bash
cp .env.example .env
# Edit .env with your actual values
```

4. Install client dependencies
```bash
cd ../client
npm install
```

5. Set up client environment variables
```bash
cp .env.example .env
# Edit .env with your actual values
```

6. Start the development servers

In the server directory:
```bash
npm run dev
```

In the client directory:
```bash
npm run dev
```

## Application Structure

### Client
- `src/assets`: Static assets like images
- `src/components`: Reusable UI components
- `src/config`: Configuration files
- `src/lib`: Utility libraries
- `src/pages`: Page components
- `src/services`: API service functions
- `src/store`: Redux store and slices
- `src/utils`: Utility functions

### Server
- `config`: Configuration files
- `controllers`: Request handlers
- `middleware`: Custom middleware
- `models`: Mongoose models
- `routes`: API routes
- `helpers`: Helper functions

## User Roles

1. **Customer**
   - Browse products
   - Add items to cart
   - Place orders
   - View order history
   - Manage wishlist

2. **Admin**
   - Manage products
   - Process orders
   - View sales reports
   - Manage featured products

3. **Super Admin**
   - All admin privileges
   - Manage users (including admins)
   - System-wide configurations
   - Manage featured collections

## API Endpoints

The API documentation can be found in the server directory.

## Deployment

Instructions for deploying to production environments will be added soon.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [React](https://reactjs.org/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Paystack](https://paystack.com/)
