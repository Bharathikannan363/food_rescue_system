import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import DataTable from '../../components/DataTable';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import SearchBar from '../../components/SearchBar';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await adminService.getLogs();
      if (res.success) setLogs(res.logs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter(l =>
    (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.description || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.username || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { header: 'Action', accessor: 'action', cell: (r) => <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">{r.action}</span> },
    { header: 'User', accessor: 'username', cell: (r) => <span className="font-semibold text-slate-800">{r.username}</span> },
    { header: 'Description', accessor: 'description', cell: (r) => <span className="text-xs text-slate-600">{r.description}</span> },
    { header: 'Timestamp', accessor: 'timestamp', cell: (r) => new Date(r.timestamp).toLocaleString() }
  ];

  if (loading) return <Loading text="Loading Audit Logs..." />;
  if (error) return <ErrorMessage message={error} retry={fetchLogs} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Action Audit Logs</h2>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search action or user..." />
      </div>

      <DataTable columns={columns} data={filtered} emptyText="No audit logs recorded." />
    </div>
  );
};

export default AdminLogs;
