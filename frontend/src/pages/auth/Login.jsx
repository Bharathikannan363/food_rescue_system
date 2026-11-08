
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import {
  Lock,
  User,
  RefreshCw,
  ShieldCheck,
  HeartHandshake
} from 'lucide-react';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaChallenge, setCaptchaChallenge] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCaptcha = async () => {
    try {
      setError('');

      const res = await authService.getCaptcha();

      if (res.success) {
        setCaptchaId(res.captcha_id);
        setCaptchaChallenge(res.code);
        setCaptchaCode('');
      } else {
        setError('Could not load CAPTCHA challenge.');
      }
    } catch (err) {
      setError(err.message || 'Could not load CAPTCHA challenge.');
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const res = await login(
        username,
        password,
        captchaId,
        captchaCode
      );

      if (!res?.success || !res?.user) {
        throw new Error(res?.message || 'Login failed.');
      }

      const role = res.user.role?.toUpperCase();

      if (role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (role === 'DONOR') {
        navigate('/donor/dashboard');
      } else if (role === 'NGO') {
        navigate('/ngo/dashboard');
      } else if (role === 'VOLUNTEER') {
        navigate('/volunteer/dashboard');
      } else {
        throw new Error('Invalid user role.');
      }

    } catch (err) {
      setError(err.message || 'Login failed.');
      await fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">

      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">

        <div className="p-6 sm:p-8 bg-emerald-600 text-white text-center">

          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <HeartHandshake className="w-7 h-7 text-white" />
          </div>

          <h2 className="text-2xl font-bold">
            Welcome Back
          </h2>

          <p className="text-emerald-100 text-xs mt-1">
            Food Rescue & Redistribution System Login
          </p>

        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">

          {error && <ErrorMessage message={error} />}

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Username
            </label>

            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Password
            </label>

            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* CAPTCHA */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">

            <div className="flex items-center justify-between">

              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Security CAPTCHA
              </span>

              <div className="flex items-center gap-2">

                <span className="px-3 py-1 bg-slate-800 text-emerald-400 font-mono font-bold tracking-widest rounded-lg text-sm">
                  {captchaChallenge || '...'}
                </span>

                <button
                  type="button"
                  onClick={fetchCaptcha}
                  className="p-1 text-slate-500 hover:text-emerald-600 rounded-lg"
                  title="Refresh CAPTCHA"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

              </div>
            </div>

            <input
              type="text"
              value={captchaCode}
              onChange={(e) => setCaptchaCode(e.target.value)}
              placeholder="Type CAPTCHA"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 uppercase font-mono tracking-wider"
              required
            />

          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-base"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </Button>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-emerald-600 font-bold hover:underline"
              >
                Register Here
              </Link>
            </p>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Login;
