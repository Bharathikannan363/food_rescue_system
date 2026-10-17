import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { AppContext } from '../context/AppContext';
import {
  LayoutDashboard, Users, Building2, HeartHandshake, Truck,
  UtensilsCrossed, FileText, MapPin, CreditCard, Bell, BarChart2,
  Activity, ShieldAlert, PlusCircle, CheckSquare, PackageCheck, History, LogOut
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const { sidebarOpen } = useContext(AppContext);

  if (!sidebarOpen || !user) return null;

  const role = user.role?.toUpperCase();

  const getLinks = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/admin/ngos', label: 'NGO Management', icon: Building2 },
          { to: '/admin/donors', label: 'Donor Management', icon: HeartHandshake },
          { to: '/admin/volunteers', label: 'Volunteer Management', icon: Truck },
          { to: '/admin/donations', label: 'All Donations', icon: UtensilsCrossed },
          { to: '/admin/requests', label: 'NGO Requests', icon: FileText },
          { to: '/admin/assignments', label: 'Assignments', icon: CheckSquare },
          { to: '/admin/tracking', label: 'Live Tracking', icon: MapPin },

          { to: '/admin/reports', label: 'Reports', icon: FileText },
          { to: '/admin/logs', label: 'Audit Logs', icon: ShieldAlert },
        ];
      case 'DONOR':
        return [
          { to: '/donor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/donor/post-food', label: 'Post Surplus Food', icon: PlusCircle },
          { to: '/donor/donations', label: 'My Donations', icon: UtensilsCrossed },
          { to: '/donor/requests', label: 'NGO Requests', icon: FileText },
          { to: '/donor/tracking', label: 'Active Pickup', icon: MapPin },
          { to: '/donor/notifications', label: 'Notifications', icon: Bell },
        ];
      case 'NGO':
        return [
          { to: '/ngo/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/ngo/donations', label: 'Available Donations', icon: UtensilsCrossed },
          { to: '/ngo/requests', label: 'My Requests', icon: FileText },
          { to: '/ngo/tracking', label: 'Volunteer Tracking', icon: MapPin },
          { to: '/ngo/deliveries', label: 'Deliveries Proof', icon: PackageCheck },
          { to: '/ngo/notifications', label: 'Notifications', icon: Bell },
        ];
      case 'VOLUNTEER':
        return [
          { to: '/volunteer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/volunteer/assignments', label: 'My Assignments', icon: CheckSquare },
          { to: '/volunteer/tracking', label: 'Live Tracking', icon: MapPin },
          { to: '/volunteer/history', label: 'Delivery History', icon: History },
          { to: '/volunteer/notifications', label: 'Notifications', icon: Bell },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-61px)] flex flex-col border-r border-slate-800 shrink-0">
      <div className="p-4 border-b border-slate-800">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Navigation Menu</p>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-600/20 text-slate-300 hover:text-red-400 rounded-xl text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
