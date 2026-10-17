```bash
cd backend
<<<<<<< HEAD
python seed.py
```
=======
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

>>>>>>> e183897c138cf335a8d6e7ba1f2159b740acdafd
