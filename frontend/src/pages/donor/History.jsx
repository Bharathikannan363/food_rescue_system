import React, { useState, useEffect } from 'react';
import { donorService } from '../../services/donorService';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';

const DonorHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    donorService.getMyDonations()
      .then(res => {
        if (res.success) {
          setHistory(res.donations.filter(d => ['COMPLETED', 'CANCELLED'].includes(d.status)));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { header: 'Food Title', accessor: 'title', cell: (r) => <span className="font-bold text-slate-800">{r.title}</span> },
    { header: 'Category', accessor: 'food_type' },
    { header: 'Quantity', accessor: 'quantity' },
    { header: 'Completed Date', accessor: 'updated_at', cell: (r) => new Date(r.updated_at).toLocaleDateString() },
    { header: 'Status', accessor: 'status', cell: (r) => <StatusBadge status={r.status} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Donation History</h2>
       
      </div>

      <DataTable columns={columns} data={history} emptyText="No historical completed donations." />
    </div>
  );
};

export default DonorHistory;
