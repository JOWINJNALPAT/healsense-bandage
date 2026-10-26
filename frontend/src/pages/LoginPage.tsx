import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  Lock,
  Mail,
  ArrowRight,
  UserCheck,
  AlertCircle,
  Settings,
  Wifi,
  CheckCircle2,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  getApiBaseUrl,
  setCustomApiUrl,
  testServerConnection,
  DEFAULT_SERVER_URL,
} from '../services/api';

export const LoginPage: React.FC = () => {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Server Settings Modal State
  const [showServerModal, setShowServerModal] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState('');
  const [testState, setTestState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    const url = getApiBaseUrl() || DEFAULT_SERVER_URL;
    setCurrentUrl(url);
    setServerUrlInput(url);
  }, []);

  const handleOpenServerModal = () => {
    const active = getApiBaseUrl() || DEFAULT_SERVER_URL;
    setServerUrlInput(active);
    setTestState('idle');
    setTestMessage('');
    setShowServerModal(true);
  };

  const handleTestConnection = async (target?: string) => {
    const toTest = target !== undefined ? target : serverUrlInput;
    setTestState('testing');
    setTestMessage('Pinging server endpoint...');
    const result = await testServerConnection(toTest);
    if (result.success) {
      setTestState('success');
      setTestMessage(result.message + (result.version ? ` (v${result.version})` : ''));
    } else {
      setTestState('error');
      setTestMessage(result.message);
    }
  };

  const handleSaveServerUrl = () => {
    setCustomApiUrl(serverUrlInput);
    const updated = getApiBaseUrl() || DEFAULT_SERVER_URL;
    setCurrentUrl(updated);
    setShowServerModal(false);
    setError(null);
  };

  const formatErrorMessage = (err: any): string => {
    const msg = err?.message || String(err);
    if (/fetch|network|failed to fetch|econnrefused/i.test(msg)) {
      return `Cannot reach server at ${currentUrl || 'configured URL'}. Ensure your PC is running the backend and both devices are on the same Wi-Fi network.`;
    }
    return msg || 'Authentication failed. Please check credentials.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (role: 'doctor' | 'staff') => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin(role);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slatebg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-500/25">
            <Activity className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-navy-900 tracking-tight text-2xl">
            Heal<span className="text-teal-600">Sense</span>™
          </span>
        </Link>
        <h2 className="text-2xl font-bold text-navy-900 tracking-tight">Clinical Portal Sign In</h2>
        <p className="text-xs text-slate-500 mt-1">
          Authorized healthcare professionals & laboratory research personnel
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200/80 sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{error}</p>
                  {error.includes('Cannot reach server') && (
                    <button
                      type="button"
                      onClick={handleOpenServerModal}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-rose-300 text-rose-800 rounded-lg font-bold text-[11px] shadow-xs hover:bg-rose-100 transition-all"
                    >
                      <Settings className="w-3.5 h-3.5 text-rose-600" />
                      Configure Server URL
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Demo Access Bar */}
          <div className="mb-6 p-4 rounded-xl bg-teal-50/70 border border-teal-200/80 text-xs">
            <p className="font-bold text-teal-900 mb-2 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-teal-700" /> Instant Demo Access:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSignIn('doctor')}
                disabled={loading}
                className="w-full py-2 px-2.5 text-center font-medium bg-white hover:bg-teal-50 text-navy-900 rounded-lg border border-teal-300 shadow-xs transition-all text-[11px]"
              >
                <strong>Doctor Role</strong>
                <span className="block text-[10px] text-slate-500">Dr. E. Reed, MD</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSignIn('staff')}
                disabled={loading}
                className="w-full py-2 px-2.5 text-center font-medium bg-white hover:bg-teal-50 text-navy-900 rounded-lg border border-teal-300 shadow-xs transition-all text-[11px]"
              >
                <strong>Nurse / Staff</strong>
                <span className="block text-[10px] text-slate-500">J. Rivera, RN</span>
              </button>
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-semibold">Or Sign In with Email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Medical Email</label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@healsense.med"
                  className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Server Connection Bar */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 truncate max-w-[220px]">
              <Wifi className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
              <span className="truncate text-[11px]" title={currentUrl}>
                {currentUrl ? currentUrl.replace(/^https?:\/\//, '') : 'Default Server'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleOpenServerModal}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100/70 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors"
            >
              <Settings className="w-3 h-3" />
              Server Setup
            </button>
          </div>
        </div>
      </div>

      {/* Server Settings Modal */}
      {showServerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center text-white">
                  <Wifi className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-navy-900 text-sm">Server Connection Setup</h3>
              </div>
              <button
                onClick={() => setShowServerModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect your mobile phone to the computer running the HealSense backend. Ensure both your phone and PC are on the same Wi-Fi.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Backend Server URL</label>
                <input
                  type="text"
                  value={serverUrlInput}
                  onChange={(e) => {
                    setServerUrlInput(e.target.value);
                    setTestState('idle');
                  }}
                  placeholder="http://192.168.1.4:5000"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Quick Presets */}
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setServerUrlInput('https://evanescence-guestbook-thu-feeding.trycloudflare.com');
                      handleTestConnection('https://evanescence-guestbook-thu-feeding.trycloudflare.com');
                    }}
                    className="px-2.5 py-1 text-[11px] bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-md font-semibold transition-colors"
                  >
                    Cloudflare Live (Online)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setServerUrlInput('http://192.168.1.4:5000');
                      handleTestConnection('http://192.168.1.4:5000');
                    }}
                    className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 rounded-md text-navy-900 font-medium transition-colors"
                  >
                    Wi-Fi: 192.168.1.4:5000
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setServerUrlInput('http://10.0.2.2:5000');
                      handleTestConnection('http://10.0.2.2:5000');
                    }}
                    className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 rounded-md text-navy-900 font-medium transition-colors"
                  >
                    Android Emulator (10.0.2.2)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setServerUrlInput('');
                      setTestState('idle');
                    }}
                    className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 rounded-md text-slate-600 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Test Connection Button & Status */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleTestConnection()}
                  disabled={testState === 'testing' || !serverUrlInput}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  {testState === 'testing' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <Wifi className="w-3.5 h-3.5 text-teal-600" />
                      Test Server Reachability
                    </>
                  )}
                </button>

                {testState === 'success' && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{testMessage}</span>
                  </div>
                )}

                {testState === 'error' && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span>{testMessage}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowServerModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveServerUrl}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-all shadow-xs"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
