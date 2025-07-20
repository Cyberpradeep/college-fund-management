# College Fund Management System

A centralized financial tracking and reporting platform for academic institutions. This system enables Heads of Departments (HoDs) to submit bills, track fund utilization, and allows Admins to manage and verify expenditures effectively.

---

## Tech Stack

- **Frontend**: React, MUI (Material UI), Axios
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT-based
- **PDF Handling**: pdfkit, pdf-merger-js
- **Deployment**: Vercel (Frontend), Render / Railway (Backend)

---

## Folder Structure

├── client/ # React Frontend
│ ├── src/
│ │ ├── pages/
│ │ ├── components/
│ │ ├── layouts/
│ │ └── services/api.js
├── server/ # Express Backend
│ ├── controllers/
│ ├── models/
│ ├── routes/
│ ├── middleware/
│ └── utils/


---

## Features

-  Secure HoD/Admin login
-  Bill Upload (with PDF merge)
-  Fund Allocation & Utilization Summary
-  Dynamic Charts and Dashboard
-  Filter & Search by Date, Status, Department
-  PDF Report Downloads
-  Admin-side Transaction Verification

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Cyberpradeep/college-fund-management.git
cd college-fund-management
```

## Backend setup
```
cd server
npm install
touch .env
```
## Add to .env

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

## Run Backend

```
npm run dev
```

## Frontend Setup

```
cd client
npm install
npm run dev
```
