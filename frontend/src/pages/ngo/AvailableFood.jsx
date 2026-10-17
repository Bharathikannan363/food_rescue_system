import React, { useState, useEffect, useRef } from 'react';
import { ngoService } from '../../services/ngoService';
import StatusBadge from '../../components/StatusBadge';
import ExpiryBadge from '../../components/ExpiryBadge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import { ShieldCheck, MapPin, Check, X } from 'lucide-react';
import api from '../../services/api';

const getPhotoUrl = (imagePath) => {
  if (!imagePath) return '';
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  const apiRoot = (api.defaults.baseURL || '/api').replace(/\/api\/?$/, '');
  return `${apiRoot}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
};

const NGOAvailableFood = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDonation, setSelectedDonation] = useState(null);
  const [isFresh, setIsFresh] = useState(true);
  const [isPackaged, setIsPackaged] = useState(true);
  const [noExpiryConcern, setNoExpiryConcern] = useState(true);
  const [isSafe, setIsSafe] = useState(true);
  const [remarks, setRemarks] = useState('Verified food temperature & fresh hygiene conditions.');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false); 

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const res = await ngoService.getAvailableDonations();
      if (res.success) setDonations(res.donations);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const handleOpenQualityModal = (donation) => {
    setSelectedDonation(donation);
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDonation || submittingRef.current) return; 

    const qualityStatus = (isFresh && isPackaged && noExpiryConcern && isSafe) ? 'VERIFIED' : 'REJECTED_QUALITY';
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await ngoService.acceptDonation(selectedDonation.id, qualityStatus, remarks);
      if (res.success) {
        alert('Food quality verified! Donation accepted and broadcast notification dispatched to ALL volunteers for pickup.');
        setSelectedDonation(null);
        fetchDonations();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (loading) return <Loading text="Loading Available Food Donations..." />;
  if (error) return <ErrorMessage message={error} retry={fetchDonations} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Available Surplus Food Donations</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {donations.map((d) => (
          <div key={d.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              {d.image ? (
                <a href={getPhotoUrl(d.image)} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-slate-200 bg-slate-50" aria-label={`Open food photo for ${d.title}`}>
                  <img src={getPhotoUrl(d.image)} alt={`Food donated: ${d.title}`} loading="lazy" className="h-48 w-full object-cover transition-transform hover:scale-[1.02]" />
                </a>
              ) : (
                <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">No food photo provided</div>
              )}
             
              <div>
                
              </div>
              <h3 className="font-bold text-slate-800 text-base">{d.title}</h3>
              <p className="text-xs text-slate-500 font-semibold">Donor: {d.donor_name}</p>
              <p className="text-xs text-slate-600 line-clamp-3">{d.description || 'Fresh surplus food prepared today.'}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {d.pickup_address}
              </p>
              <div className="pt-1">
                <span className="text-sm font-extrabold text-slate-800">Quantity: {d.quantity}</span>
              </div>
            </div>

            <Button
              className="w-full mt-3"
              icon={ShieldCheck}
              disabled={d.expiry_state === 'EXPIRED'}
              onClick={() => handleOpenQualityModal(d)}
            >
              {d.expiry_state === 'EXPIRED' ? 'Expired ' : 'Verify Quality & Accept Donation'}
            </Button>
          </div>
        ))}
      </div>

      {selectedDonation && (
        <Modal
          isOpen={!!selectedDonation}
          onClose={() => setSelectedDonation(null)}
          title="Mandatory Food Quality Verification Checklist"
        >
          <form onSubmit={handleRequestSubmit} className="space-y-4 text-sm">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              Verify food freshness & safety criteria for item: <strong>{selectedDonation.title}</strong> ({selectedDonation.quantity})
            </div>

            {selectedDonation.image && (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-slate-500">Donor's food photo</p>
                <a href={getPhotoUrl(selectedDonation.image)} target="_blank" rel="noreferrer">
                  <img src={getPhotoUrl(selectedDonation.image)} alt={`Food photo for ${selectedDonation.title}`} className="max-h-64 w-full rounded-xl border border-slate-200 bg-slate-50 object-contain" />
                </a>
              </div>
            )}

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="flex items-center justify-between">
                <span className="font-medium text-slate-700">1. Does food appear fresh and hygienic?</span>
                <input
                  type="checkbox"
                  checked={isFresh}
                  onChange={(e) => setIsFresh(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between">
                <span className="font-medium text-slate-700">2. Is packaging clean & acceptable?</span>
                <input
                  type="checkbox"
                  checked={isPackaged}
                  onChange={(e) => setIsPackaged(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between">
                <span className="font-medium text-slate-700">3. Free of expiry or spoilage concerns?</span>
                <input
                  type="checkbox"
                  checked={noExpiryConcern}
                  onChange={(e) => setNoExpiryConcern(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between">
                <span className="font-medium text-slate-700">4. Certified safe to distribute to beneficiaries?</span>
                <input
                  type="checkbox"
                  checked={isSafe}
                  onChange={(e) => setIsSafe(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Quality Inspection Remarks</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter quality remarks..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setSelectedDonation(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="success" icon={Check} disabled={submitting}>
                {submitting ? 'Accepting & Broadcasting...' : 'ACCEPT DONATION (NOTIFY ALL VOLUNTEERS)'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default NGOAvailableFood;
