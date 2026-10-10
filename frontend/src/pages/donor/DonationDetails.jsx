import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import { ArrowLeft } from 'lucide-react';

const DonorDonationDetails = () => {
  return (
    <div className="space-y-6">
      <Link to="/donor/donations">
        <Button variant="outline" size="sm" icon={ArrowLeft}>Back to Donations</Button>
      </Link>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">Donation Details</h2>
      
      </div>
    </div>
  );
};

export default DonorDonationDetails;
