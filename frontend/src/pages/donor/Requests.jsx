import React, { useState, useEffect } from 'react';
import { donorService } from '../../services/donorService';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import { CheckCircle2, XCircle } from 'lucide-react';

const DonorRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await donorService.getRequests();
      if (res.success) setRequests(res.requests);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRespond = async (requestId, action) => {
    try {
      await donorService.respondRequest(requestId, action);
      fetchRequests();
    } catch (err) {
      alert('Error responding to request: ' + err.message);
    }
  };

  const columns = [
    { header: 'Food Title', accessor: 'donation_title', cell: (r) => <span className="font-bold text-slate-800">{r.donation_title}</span> },
    { header: 'Requesting NGO', accessor: 'ngo_name', cell: (r) => <span className="font-semibold text-amber-700">{r.ngo_name}</span> },
    { header: 'Quality Verification', accessor: 'quality_status', cell: (r) => <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold border border-emerald-200">{r.quality_status}</span> },
    { header: 'Status', accessor: 'status', cell: (r) => <StatusBadge status={r.status} /> },
    {
      header: 'Donor Permission Action',
      cell: (r) => (
        <div className="flex items-center gap-2">
          {r.status === 'PENDING' ? (
            <>
              <Button size="sm" variant="success" icon={CheckCircle2} onClick={() => handleRespond(r.id, 'ACCEPT')}>
                ACCEPT
              </Button>
              <Button size="sm" variant="danger" icon={XCircle} onClick={() => handleRespond(r.id, 'REJECT')}>
                REJECT
              </Button>
            </>
          ) : (
            <span className="text-xs text-slate-400 font-medium">Responded</span>
          )}
        </div>
      )
    }
  ];

  if (loading) return <Loading text="Loading NGO Requests..." />;
  if (error) return <ErrorMessage message={error} retry={fetchRequests} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">NGO Food Requests</h2>
      
      </div>

      <DataTable columns={columns} data={requests} emptyText="No NGO requests received yet." />
    </div>
  );
};

export default DonorRequests;
