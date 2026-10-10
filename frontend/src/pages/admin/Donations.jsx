import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Loading from '../../components/Loading';

const AdminDonations = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const res = await adminService.getDonations();
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

  const handleVerify = async (id) => {
    try {
      await adminService.verifyDonation(id);
      fetchDonations();
    } catch (err) {
      alert('Error approving donation: ' + err.message);
    }
  };

  const columns = [
    { header: 'Food Title', accessor: 'title', cell: (r) => <span className="font-bold text-slate-800">{r.title}</span> },
    { header: 'Donor', accessor: 'donor_name' },
    { header: 'Category', accessor: 'food_type', cell: (r) => <span className="text-xs bg-slate-100 px-2 py-1 rounded font-semibold">{r.food_type}</span> },
    { header: 'Quantity', accessor: 'quantity' },
    { header: 'Pickup Address', accessor: 'pickup_address', cell: (r) => <span className="text-xs text-slate-600 truncate max-w-xs block">{r.pickup_address}</span> },
    { header: 'Status', accessor: 'status', cell: (r) => <StatusBadge status={r.status} /> },
    {
      header: 'Actions',
      cell: (r) => (
        <div>
          {r.status === 'PENDING_ADMIN_APPROVAL' && (
            <Button size="sm" variant="success" onClick={() => handleVerify(r.id)}>
              Approve Post
            </Button>
          )}
        </div>
      )
    }
  ];


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">All Surplus Food Donations</h2>
      </div>
      <DataTable columns={columns} data={donations} emptyText="No donations recorded." />
    </div>
  );
};

export default AdminDonations;
