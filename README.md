# Food Rescue & Redistribution System

A full-stack, modular, role-based web application connecting **Food Donors, NGOs, Volunteers, and Administrators** to eliminate food waste and deliver surplus meals to people in need.

---

## ✨ Key Features

- **Role-Based Portals** — separate dashboards and permissions for Donors, NGOs, Volunteers, and Admin (JWT + CAPTCHA + RBAC guards on every endpoint)
- **Expiry Validation (FSSAI-aligned)** — donations carry preparation & best-before times; every donation is flagged **FRESH / EXPIRING SOON (≤ 2 h) / EXPIRED** on read. Expired food is blocked from NGO requests and delivery confirmations *server-side*
- **Proximity Matcher** — the admin's assignment screen lists approved volunteers **ranked nearest-first** (haversine distance from each volunteer's latest live GPS ping to the donation pickup pin), with km shown, `NO LIVE PING` / `NO LOCATION` markers, and manual override always possible. Pickup distance is recorded in the audit log
- **Enforced Delivery Workflow** — status transitions *Assigned → Accepted → Picked Up → Out for Delivery → Delivered* are validated server-side (no skipping or going backwards), with race protection on assignment acceptance
- **Resource Ownership Guards** — volunteers can only respond to / update / upload proof for their own assignments; NGOs can only confirm their own deliveries
- **Live Tracking & Proof** — HTML5 Geolocation broadcasting, Leaflet/OpenStreetMap live maps, delivery proof photo uploads, beneficiary-count confirmation ("Mark as Done NGO OK")
- **Analytics & Audit** — auto-computed impact metrics (deliveries, beneficiaries, food saved), monthly CSV report export, and audit logs that record actions including pickup distances

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router DOM, Axios, Recharts, Leaflet & React-Leaflet, Lucide Icons
- **Backend**: Python Flask, Flask-SQLAlchemy ORM, Flask-JWT-Extended, Flask-CORS, Werkzeug Password Hashing
- **Database**: SQLite (`database/food_rescue.db`) — geospatial distances computed in Python (haversine), no extra DB extensions needed
- **Authentication**: Username, Password, 5-digit CAPTCHA Code, JWT Authentication with Role-Based Route Guards
- **Tracking & Maps**: HTML5 Geolocation API (`navigator.geolocation.watchPosition`), Leaflet OpenStreetMap Tiles
- **Notifications**: In-App Notification Center & Mock SMS Dispatcher (with optional Twilio integration)

---

## 🚀 Quick Setup & Local Running Instructions

### 1. Backend Server Setup

```bash
cd backend
python seed.py        # Initializes SQLite database & populates demo accounts
python run.py         # Launches Flask REST API server on http://127.0.0.1:5000
```

### 2. Frontend Web Application Setup

```bash
cd frontend
npm install           # Installs React, Vite, Leaflet, Recharts, Lucide dependencies
npm run dev           # Starts Vite Development Server on http://localhost:3000
```

> Re-running `python seed.py` resets the database to the demo state. The seed includes
> donations in all three expiry states (fresh, expiring-soon, expired) and volunteers
> with live GPS pings so the proximity matcher and expiry badges are demonstrable.

---

## 🔑 Pre-Configured Demo Credentials

Use these demo accounts to log in at **[http://localhost:3000/login](http://localhost:3000/login)**:

| Role | Username | Password | Organization / Name | Key Portal Features |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `Admin@123` | System Administrator | Monitor all activities, live volunteer GPS tracking map, donations & requests, analytics, audit logs |
| **Donor** | `donor` | `Donor@123` | Grand Palace Hotel | Post surplus food, prep/expiry times, 20-min cancel window, track workflow progress |
| **NGO 1** | `ngo` | `Ngo@123` | Hope & Care Shelter | Browse available food, FSSAI verification, **Accept food & broadcast to volunteers**, confirm delivery OK |
| **NGO 2** | `ngo2` | `Ngo@123` | Annapoorna Food Relief | Second NGO to demonstrate multi-NGO view & race-guard (first NGO to accept locks the donation) |
| **NGO 3** | `ngo3` | `Ngo@123` | Seva Community Kitchen | Third NGO shelter demonstrating community distribution and beneficiary confirmation |
| **Volunteer 1** | `volunteer` | `Volunteer@123` | Alex Rivera (Van) | **Accept open broadcast deliveries**, enforced status workflow, HTML5 GPS broadcasting, proof upload |
| **Volunteer 2** | `volunteer2` | `Volunteer@123` | Priya Sharma (Scooter) | Second volunteer demonstrating broadcast claiming competition and proximity ranking (~1.5 km) |
| **Volunteer 3** | `volunteer3` | `Volunteer@123` | Ravi Kumar (Bike) | Third volunteer demonstrating open task view with dynamic location sharing |

---

## 🔄 End-to-End Broadcast Workflow

```
                    ┌──────────────┐
                    │    DONOR     │
                    └──────┬───────┘
                           │
                    Create Donation
                           │
                           ▼
                ┌─────────────────────┐
                │ Donation Available  │
                └──────────┬──────────┘
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
         NGO 1          NGO 2          NGO 3
        Can View        Can View       Can View
             │             │             │
             └─────────────┼─────────────┘
                           │
                    One NGO Accepts
                           │
                           ▼
                  ┌────────────────┐
                  │ NGO Accepted   │
                  └───────┬────────┘
                          │
                    Notify ALL
                    Volunteers
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
        Volunteer 1  Volunteer 2  Volunteer 3
        Can Accept   Can Accept   Can Accept
             │            │            │
             └────────────┼────────────┘
                          │
                  First Volunteer
                     Accepts
                          │
                          ▼
                ┌──────────────────┐
                │ Volunteer        │
                │ Assigned         │
                └────────┬─────────┘
                         │
                       Pickup
                         │
                         ▼
                    Delivery
                         │
                         ▼
                    NGO receives
                         │
                         ▼
                   Beneficiaries


        ┌────────────────────────────────────┐
        │              ADMIN                 │
        │                                    │
        │ Monitor all activities             │
        │ Donors / NGOs / Volunteers         │
        │ Donations / Requests / Assignments │
        │ Live volunteer location            │
        │ Delivery status                    │
        │ Reports / Analytics / Logs         │
        └────────────────────────────────────┘
```

1. **Donor**: Posts surplus food with photos, pickup coordinates, and preparation/expiry times. Status is **Donation Available**.
2. **NGOs (NGO 1, 2, 3)**: All NGOs can view available food batches with FSSAI expiry & safety badges.
3. **One NGO Accepts**: The first NGO to inspect and accept claims the donation (**NGO Accepted**). Other NGOs are prevented from duplicate claims via atomic 409 Conflict race guards.
4. **Notify ALL Volunteers**: Automated broadcast notification and SMS alert is immediately dispatched to **ALL** approved volunteers.
5. **Volunteers (Volunteer 1, 2, 3)**: All volunteers see the open delivery task in their broadcast feed.
6. **First Volunteer Accepts**: First volunteer to accept claims the task (**Volunteer Assigned**). Subsequent claims by other volunteers are rejected with 409 Conflict.
7. **Pickup & Delivery**: Volunteer marks **Picked Up** $\rightarrow$ **Out for Delivery** $\rightarrow$ uploads proof photo for **Delivered**.
8. **NGO Receives & Beneficiaries**: NGO inspects the delivery proof, confirms receipt (**NGO OK**), and records total beneficiary count (**Completed**).
9. **Admin**: Monitors all activities, live GPS locations, fulfillment statuses, impact analytics, and audit logs.

---

