import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

import { MapPin, Radio } from 'lucide-react';

const AdminAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState('');
  const [selectedVolId, setSelectedVolId] = useState('');
  const [nearby, setNearby] = useState(null); // proximity-ranked volunteers for the selected request

  // Proximity Matcher: fetch volunteers ranked by distance when a request is chosen
  useEffect(() => {
    setNearby(null);
    const req = requests.find(r => String(r.id) === String(selectedReqId));
    if (!req?.donation_id) return;
    let stale = false;
    adminService.getNearbyVolunteers(req.donation_id)
      .then(res => { if (!stale && res.success) setNearby(res); })
      .catch(() => {});
    return () => { stale = true; };
  }, [selectedReqId, requests]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignRes, reqRes, volRes] = await Promise.all([
        adminService.getAssignments(),
        adminService.getRequests(),
        adminService.getVolunteers()
      ]);
      const assignedRequestIds = new Set(assignments.map(a => a.request_id));
      const unassignedAcceptedRequests = requests.filter(r => r.status === 'ACCEPTED' && !assignedRequestIds.has(r.id));

      if (assignRes.success) setAssignments(assignRes.assignments);
      if (reqRes.success) setRequests(reqRes.requests.filter(r => r.status === 'ACCEPTED'));
      if (volRes.success) setVolunteers(volRes.volunteers.filter(v => v.approval_status === 'APPROVED'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReqId || !selectedVolId) return alert('Select both request and volunteer.');

    try {
      await adminService.assignVolunteer(selectedReqId, selectedVolId);
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Error assigning volunteer: ' + err.message);
    }
  };

  const assignedRequestIds = new Set(assignments.map(a => a.request_id));
  const openBroadcasts = requests.filter(r => !assignedRequestIds.has(r.id));

  const columns = [
    { header: 'Donation', accessor: 'request_details', cell: (r) => <span className="font-bold text-slate-800">{r.request_details?.donation_title || 'Food Pickup'}</span> },
    { header: 'Assigned Volunteer', accessor: 'volunteer_name', cell: (r) => <span className="font-medium text-slate-700">{r.volunteer_name} ({r.vehicle_type || 'Bike'})</span> },
    { header: 'NGO', accessor: 'request_details', cell: (r) => r.request_details?.ngo_name || 'NGO' },
    { header: 'Status', accessor: 'status', cell: (r) => <StatusBadge status={r.status} /> },
    { header: 'Assigned Date', accessor: 'assigned_at', cell: (r) => new Date(r.assigned_at).toLocaleDateString() }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Volunteer Assignments & Broadcast Monitor</h2>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          Assign Volunteer Manually
        </Button>
      </div>

      {/* Open Broadcasts Feed */}

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="font-bold text-slate-800 text-sm">Claimed & Active Volunteer Deliveries</h3>
        <DataTable columns={columns} data={assignments} emptyText="No active assignments." />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Assign Volunteer to Request">
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Accepted Food Request</label>
            <select
              value={selectedReqId}
              onChange={(e) => setSelectedReqId(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
              required
            >
              <option value="">-- Choose Accepted Request --</option>
              {requests.map(r => (
                <option key={r.id} value={r.id}>
                  {r.donation_title} → {r.ngo_name} ({r.donor_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Approved Volunteer</label>
            {nearby ? (
              <div className="space-y-1.5 max-h-56 overflow-y-auto p-1">
                {nearby.volunteers.map((v, i) => (
                  <button
                    key={v.volunteer_id}
                    type="button"
                    onClick={() => setSelectedVolId(String(v.volunteer_id))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-left text-sm transition-all ${
                      String(selectedVolId) === String(v.volunteer_id)
                        ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-300'
                        : 'border-slate-200 bg-slate-50 hover:border-emerald-300'
                    }`}
                  >
                    <span className="flex items-center gap-2 font-medium text-slate-700">
                      <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-800 text-white text-[10px] font-bold">{i + 1}</span>
                      {v.full_name} ({v.vehicle_type || 'Bike'})
                      {!v.is_available && <span className="text-[10px] font-bold text-slate-400">· BUSY</span>}
                      {!v.has_ping && v.distance_km !== null && <span className="text-[10px] font-bold text-slate-400" title="No recent GPS ping - distance from registered location">· NO LIVE PING</span>}
                      {v.distance_km === null && <span className="text-[10px] font-bold text-slate-400">· NO LOCATION</span>}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 whitespace-nowrap">
                      {v.has_ping && <MapPin className="w-3.5 h-3.5" />}
                      {v.distance_km !== null ? `${v.distance_km} km` : '—'}
                    </span>
                  </button>
                ))}
                <p className="text-[10px] text-slate-400 px-1 pt-1 flex items-center gap-1">
                  <Radio className="w-3 h-3" /> Ranked nearest-first from live GPS pings — manual choice still possible
                </p>
              </div>
            ) : (
              <select
                value={selectedVolId}
                onChange={(e) => setSelectedVolId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
                required
              >
                <option value="">-- Choose Volunteer --</option>
                {volunteers.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.full_name} ({v.vehicle_type}) - Phone: {v.phone}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Assign Volunteer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminAssignments;
