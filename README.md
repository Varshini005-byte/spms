# Smart Permission Management System (SPMS)

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![React](https://img.shields.io/badge/frontend-React.js-61DAFB)
![Node.js](https://img.shields.io/badge/backend-Node.js-339933)
![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-336791)

The **Smart Permission Management System (SPMS)** is a comprehensive, full-stack web application designed to streamline the process of requesting, verifying, and approving student permissions in educational institutions. It digitizes paper-based permission slips into a secure, efficient, and trackable online workflow involving students, parents, and faculty members.

##  Features

- **Multi-Role Authentication**: Secure access for Students, Faculty, Parents, and Administrators.
- **Automated Workflow**: End-to-end request creation, review, and approval process.
- **Parent Verification via OTP**: Secure Two-Factor Authentication (2FA) utilizing OTPs sent via email to parents for verifying permission requests.
- **Real-Time Email Notifications**: Instant email alerts for faculty members upon new requests and for students upon approval/rejection decisions.
- **Audit Logging**: Robust, database-backed tracking of all permission state changes and email delivery statuses.
- **Interactive Dashboard**: Data visualization and analytics tracking request metrics.
- **Document Uploads**: Secure file attachments for supporting documents utilizing `multer`.

##  Technology Stack

### Frontend
- **React.js** (v19) - User Interface
- **React Router** - Navigation
- **Lucide React** - Iconography
- **Recharts** - Data Visualization
- **Tailwind CSS / Vanilla CSS** - Styling

### Backend
- **Node.js & Express.js** - API & Server
- **PostgreSQL** (`pg`) - Relational Database
- **Nodemailer** - SMTP Email Integration
- **Bcrypt** - Password Hashing & Security
- **Multer** - File Upload Management

### Deployment
- **Render** - Consolidated monolith deployment (Frontend served via Node.js backend).

##  Prerequisites

Before you begin, ensure you have met the following requirements:
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL installed and running locally
- An SMTP Email Account (e.g., Gmail, SendGrid, etc.) for email notifications

##  Installation & Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/spms.git
   cd spms
   ```

2. **Install Backend Dependencies**
   ```bash
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Database Configuration**
   - Create a new PostgreSQL database.
   - Run the migration scripts to set up the schema:
     ```bash
     node migrate.js
     ```

5. **Environment Variables**
   Create a `.env` file in the root directory and add the following variables:
   ```env
   # Database Configuration
   DATABASE_URL=postgresql://username:password@localhost:5432/spms_db

   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Email/SMTP Configuration
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your-email@example.com
   SMTP_PASS=your-email-password
   ```

6. **Run the Application**
   - To start the backend server:
     ```bash
     npm start
     ```
   - To start the frontend development server (in a separate terminal):
     ```bash
     cd frontend
     npm start
     ```

##  Project Structure

```
spms/
├── controllers/       # Backend business logic and API route handlers
├── db/                # Database connection utilities
├── frontend/          # React single-page application
│   ├── public/        # Static assets
│   └── src/           # React components, pages, and hooks
├── routes/            # Express API routes definition
├── sql/               # SQL schema and migration files
├── uploads/           # User uploaded files/documents
├── utils/             # Helper functions (e.g., email transport, OTP generation)
├── server.js          # Express server entry point
└── package.json       # Project dependencies and scripts
```

##  Deployment

This application is configured to be deployed as a single unified web service on Render. The `npm run build` command automatically installs frontend dependencies, builds the React app, and the Express backend is configured to serve the static build files in production mode.

1. Connect your repository to Render.
2. Select **Web Service**.
3. Build Command: `npm run build`
4. Start Command: `npm start`
5. Ensure all Environment Variables are set in the Render dashboard.

## Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

##  License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
