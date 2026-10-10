import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import SearchBar from '../../components/SearchBar';


const AdminDonors = () => {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const res = await adminService.getDonors();
      if (res.success) setDonors(res.donors);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  const handleStatusUpdate = async (userId, status) => {
    try {
      await adminService.updateUserStatus(userId, status);
      fetchDonors();
    } catch (err) {
      alert('Error updating Donor status: ' + err.message);
    }
  };

  const filtered = donors.filter(d =>
    (d.organization_name || d.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { header: 'Donor / Organization', accessor: 'organization_name', cell: (r) => <span className="font-bold text-slate-800">{r.organization_name || r.username}</span> },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Address', accessor: 'address', cell: (r) => <span className="text-xs text-slate-600 truncate max-w-xs block">{r.address}</span> },
    { header: 'Approval Status', accessor: 'approval_status', cell: (r) => <StatusBadge status={r.approval_status} /> },
    {
      header: 'Actions',
      cell: (r) => (
        <div className="flex items-center gap-2">
          {r.approval_status !== 'APPROVED' && (
            <Button size="sm" variant="success" onClick={() => handleStatusUpdate(r.user_id, 'APPROVED')}>Approve</Button>
          )}
          {r.approval_status === 'APPROVED' && (
            <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(r.user_id, 'DEACTIVATED')}>Deactivate</Button>
          )}
          {r.approval_status === 'DEACTIVATED' && (
            <Button size="sm" variant="secondary" onClick={() => handleStatusUpdate(r.user_id, 'APPROVED')}>Reactivate</Button>
          )}
        </div>
      )
    }
  ];


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Donor Management</h2>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search Donor organization..." />
      </div>
      <DataTable columns={columns} data={filtered} emptyText="No Donors found." />
    </div>
  );
};

export default AdminDonors;
