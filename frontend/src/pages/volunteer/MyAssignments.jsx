import React, { useState, useEffect } from 'react';
import { volunteerService } from '../../services/volunteerService';
import StatusBadge from '../../components/StatusBadge';
import ExpiryBadge from '../../components/ExpiryBadge';
import Button from '../../components/Button';
import ImageUpload from '../../components/ImageUpload';
import Modal from '../../components/Modal';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import { CheckCircle2, Truck, Package, Check, Camera, Radio, MapPin, Building2, UserCheck, AlertCircle } from 'lucide-react';

const VolunteerMyAssignments = () => {
  const [activeTab, setActiveTab] = useState('open_tasks'); // 'open_tasks' | 'my_deliveries'
  const [openTasks, setOpenTasks] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [error, setError] = useState(null);

  // Proof Upload Modal
  const [proofAssignId, setProofAssignId] = useState(null);
  const [proofFile, setProofFile] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, assignsRes] = await Promise.all([
        volunteerService.getAvailableTasks(),
        volunteerService.getAssignments()
      ]);
      if (tasksRes.success) setOpenTasks(tasksRes.tasks || []);
      if (assignsRes.success) setAssignments(assignsRes.assignments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s polling for live broadcasts
    return () => clearInterval(interval);
  }, []);

  const handleClaimTask = async (requestId) => {
    try {
      setClaimingId(requestId);
      const res = await volunteerService.claimTask(requestId);
      if (res.success) {
        alert(res.message || 'Delivery task claimed successfully! Please proceed to pickup.');
        await fetchData();
        setActiveTab('my_deliveries');
      }
    } catch (err) {
      alert(err.message); // Displays "This delivery task has already been claimed by another volunteer."
      fetchData();
    } finally {
      setClaimingId(null);
    }
  };

  const handleRespond = async (id, action) => {
    try {
      const res = await volunteerService.respondAssignment(id, action);
      if (res.success) {
        alert(`Assignment ${action.toLowerCase()}ed successfully!`);
        fetchData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStatusTransition = async (assignmentId, nextStatus) => {
    try {
      await volunteerService.updateStatus(assignmentId, nextStatus);
      fetchData();
    } catch (err) {
      alert('Error updating delivery status: ' + err.message);
    }
  };

  const handleProofSubmit = async (e) => {
    e.preventDefault();
    if (!proofAssignId || !proofFile) return alert('Select photo file first.');

    const formData = new FormData();
    formData.append('assignment_id', proofAssignId);
    formData.append('proof_image', proofFile);

    try {
      const res = await volunteerService.uploadProof(formData);
      if (res.success) {
        alert('Delivery proof photo uploaded successfully! Status updated to DELIVERED.');
        setProofAssignId(null);
        setProofFile(null);
        fetchData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading && openTasks.length === 0 && assignments.length === 0) {
    return <Loading text="Loading Delivery Portal & Broadcasts..." />;
  }

  if (error && openTasks.length === 0 && assignments.length === 0) {
    return <ErrorMessage message={error} retry={fetchData} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Volunteer Delivery Portal</h2>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('open_tasks')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'open_tasks'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>Open Broadcasts</span>
            <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full">
              {openTasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('my_deliveries')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'my_deliveries'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>My Deliveries</span>
            <span className="ml-1 px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[10px] rounded-full">
              {assignments.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: OPEN BROADCAST TASKS */}
      {activeTab === 'open_tasks' && (
        <div className="space-y-4">

          {openTasks.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-semibold text-sm text-slate-600">No Open Delivery Tasks Right Now</p>
             
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {openTasks.map((t) => (
                <div key={t.request_id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                          {t.food_type}
                        </span>
                        <h3 className="font-bold text-slate-800 text-base mt-1.5">{t.title}</h3>
                        <p className="text-xs font-extrabold text-slate-900">Quantity: {t.quantity}</p>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={t.status} />
                        <div className="mt-1">
                          <ExpiryBadge state={t.expiry_state} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div>
                        <p className="font-bold text-slate-800 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" /> 1. Pickup from (Donor):
                        </p>
                        <p className="ml-5 font-semibold text-slate-700">{t.donor_name}</p>
                        <p className="ml-5 text-slate-500">{t.pickup_address}</p>
                        {t.distance_km !== null && (
                          <p className="ml-5 text-[11px] font-bold text-emerald-700 mt-0.5">
                            📍 ~{t.distance_km} km away from your location
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-200">
                        <p className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-600" /> 2. Deliver to (NGO):
                        </p>
                        <p className="ml-5 font-semibold text-slate-700">{t.ngo_name}</p>
                        <p className="ml-5 text-slate-500">{t.ngo_address}</p>
                        {t.ngo_phone && <p className="ml-5 text-slate-400">Phone: {t.ngo_phone}</p>}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="success"
                    className="w-full font-bold shadow-md shadow-emerald-700/20"
                    icon={CheckCircle2}
                    disabled={claimingId === t.request_id}
                    onClick={() => handleClaimTask(t.request_id)}
                  >
                    {claimingId === t.request_id ? 'Claiming Task...' : 'ACCEPT DELIVERY TASK (CLAIM NOW)'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY ACTIVE & COMPLETED DELIVERIES */}
      {activeTab === 'my_deliveries' && (
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl space-y-2">
              <Truck className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-semibold text-sm text-slate-600">No Deliveries Claimed Yet</p>
              <p className="text-xs text-slate-400">Switch to the "Open Broadcasts" tab to accept an available delivery.</p>
              <Button size="sm" onClick={() => setActiveTab('open_tasks')} className="mt-2">
                View Open Broadcasts
              </Button>
            </div>
          ) : (
            assignments.map((a) => (
              <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">
                      {a.request_details?.donation_title || 'Food Rescue Pickup'}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold">
                      NGO Shelter: {a.request_details?.ngo_name} · Quantity: {a.request_details?.donation_quantity}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <p className="font-bold text-slate-800 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" /> 1. Pickup Details (Donor):
                    </p>
                    <p><strong>Name:</strong> {a.request_details?.donor_name}</p>
                    <p><strong>Address:</strong> {a.request_details?.donation_pickup_address}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 mb-1 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" /> 2. Delivery Details (NGO):
                    </p>
                    <p><strong>NGO:</strong> {a.request_details?.ngo_name}</p>
                    <p><strong>Phone:</strong> {a.request_details?.ngo_phone}</p>
                    <p><strong>Address:</strong> {a.request_details?.ngo_address}</p>
                  </div>
                </div>

                {/* Enforced Status Transition Action Bar */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {a.status === 'ASSIGNED' && (
                    <>
                      <Button size="sm" variant="success" onClick={() => handleRespond(a.id, 'ACCEPT')}>
                        ACCEPT ASSIGNMENT
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleRespond(a.id, 'REJECT')}>
                        REJECT ASSIGNMENT
                      </Button>
                    </>
                  )}

                  {a.status === 'ACCEPTED' && (
                    <Button size="sm" variant="primary" icon={Package} onClick={() => handleStatusTransition(a.id, 'PICKED_UP')}>
                      MARK AS PICKED UP
                    </Button>
                  )}

                  {a.status === 'PICKED_UP' && (
                    <Button size="sm" variant="warning" icon={Truck} onClick={() => handleStatusTransition(a.id, 'OUT_FOR_DELIVERY')}>
                      MARK AS OUT FOR DELIVERY
                    </Button>
                  )}

                  {a.status === 'OUT_FOR_DELIVERY' && (
                    <Button size="sm" variant="success" icon={Camera} onClick={() => setProofAssignId(a.id)}>
                      UPLOAD PROOF & MARK DELIVERED
                    </Button>
                  )}

                  {a.status === 'DELIVERED' && (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                      Delivered! Awaiting NGO Confirmation & Beneficiary Count.
                    </span>
                  )}

                  {a.status === 'COMPLETED' && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Delivery Completed & Beneficiaries Fed!
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Upload Proof Photo Modal */}
      {proofAssignId && (
        <Modal isOpen={!!proofAssignId} onClose={() => setProofAssignId(null)} title="Upload Delivery Proof Photo">
          <form onSubmit={handleProofSubmit} className="space-y-4">
            <ImageUpload onChange={setProofFile} label="Take Picture or Upload Delivery Proof Photo" />
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setProofAssignId(null)}>Cancel</Button>
              <Button type="submit" variant="success">Upload Proof & Complete Delivery</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default VolunteerMyAssignments;
