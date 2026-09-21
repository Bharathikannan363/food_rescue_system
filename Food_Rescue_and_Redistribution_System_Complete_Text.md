Food Rescue & Redistribution System
Team: Equality Engine  
Sharveshwar | Elavarasi | Bharathikannan

Problem
Daily food wastage: hotels, restaurants, messes, events.

Poor coordination: phone calls, groups, personal contacts.

Food insecurity: edible food wasted, people hungry.

Causes: manual process, no central system, no expiry check, no safety validation, no tracking, no data.

Solution
Centralized web platform.

Verified donor registration.

NGO real-time requests.

Automated logistics: volunteer assignment, delivery tracking, expiry validation.

Impact analytics: proof, confirmation, reports.

Flow: Donor → Admin → NGO → Volunteer → Reports.

Stakeholders
Donors: hotels, messes, halls.

NGOs: shelters, beneficiaries.

Volunteers: pickup & delivery.

Admin: verify, monitor, report.

Govt/FSSAI: safety compliance.

SDG Goals:

SDG 2: Zero Hunger.

SDG 12: Responsible Consumption.

SDG 17: Partnerships.

Modules
Donor: Register, post donations.

NGO: View, request food.

Volunteer: Accept tasks, deliver, upload proof.

Admin: Verify, assign, report.

Architecture
Three-Tier System

Frontend: React.js + Tailwind.

Backend: Python (Flask/FastAPI).

Database: SQLite + Spatial Ext.

Workflow:

Donor uploads food.

Admin verifies.

NGO accepts/rejects.

Volunteer assigned (proximity matcher).

Delivery → NGO confirms → Reports generated.

Data Flow
Donor submits → Verification → NGO match → Volunteer assignment → Delivery proof → Admin analytics.

Entities: Users, Donations, Requests, Deliveries, Analytics.

Algorithms
Donor: Login → Enter food → Upload image → Validate → Store → Notify NGOs.
Admin: Login → Manage users → Verify donations → Assign volunteers → Generate reports.
NGO: Login → View donations → Verify → Accept/Reject → Notify donor/admin.
Volunteer: Login → Accept task → Pickup → Deliver → Upload proof → Confirm.

Database Schema
Tables: Users, Donors, NGOs, Volunteers, Donations, Requests, Assignments, Deliveries, Reports, Logs.

Users: user_id, name, email, role, status.

Donations: donation_id, donor_id, food_name, qty, prep_time, expiry, image, location, status.

Requests: request_id, ngo_id, donation_id, status.

Deliveries: delivery_id, assignment_id, pickup_time, delivery_time, proof.

Reports: month, donations, deliveries, beneficiaries.

Relationships:

User ↔ Donor/NGO/Volunteer (1:1).

Donor → Donations (1:N).

Donation → Requests (1:N).

Request → Assignment (1:1).

Assignment → Delivery (1:1).

UI & Dashboards
Donor: Post food, track status, view impact.

NGO: Browse donations, request, confirm receipt.

Volunteer: Assigned tasks, pickup/delivery, upload proof.

Admin: Verify users, monitor donations, assign volunteers, generate reports.

Timeline (12 Weeks)
W1–W2: Requirement, Survey.

W3–W4: UI, DB design.

W5–W6: Backend dev.

W7–W8: Frontend dev.

W9: Integration.

W10: Testing.

W11: Documentation.

W12: Deployment & Go Live.

Team Contributions
Bharathikannan: Database schema, ER model, tables, queries, optimization.

Sharveshwar: Backend APIs, authentication, donation mgmt, request handling, volunteer assignment, delivery tracking.

Elavarasi: Frontend UI, React + Tailwind, portals, dashboards, charts, UX.

Goal: Build secure, scalable, impactful system reducing food waste & hunger.