import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineArrowLeft } from 'react-icons/hi';
import { BsArrowRight, BsCheckCircleFill } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import useContext from '../../context/context';

const COLORS = {
  ink: '#0B1F17',
  paper: '#F5F1E8',
  granted: '#3FA66B',
  denied: '#C24B3F',
  sage: '#9CA89C',
};

const userTypes = [
  { value: 'student', label: 'Student' },
  { value: 'lecturer', label: 'Lecturer' },
  { value: 'other', label: 'Other' },
];

const AuthPage = () => {
  const setToast = useContext((state) => state.setToast)
  const navigate = useNavigate()
  const [mode, setMode] = useState('login'); // 'login' | 'signup'

  // shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // signup-only fields
  const [name, setName] = useState('');
  const [type, setType] = useState('student');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await axios.post('/api/signup',{ name, email, password, type },{ withCredentials: true })
        const mes = res.data.message
        setMode('login')
        setToast(mes? mes : 'signup was successful')
        
      } else {
        const res = await axios.post('/api/login',{ email, password },{ withCredentials: true })
        setToast('login successfully')
        navigate('/profile')
        
      }
      // TODO: wire up axios call + redirect on success
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ background: COLORS.ink, color: COLORS.paper }}
      className="min-h-screen flex flex-col"
    >
      {/* ---------------- NAV ---------------- */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-6">
        <Link to="/" className="flex items-center gap-2 text-sm" style={{ color: COLORS.sage }}>
          <HiOutlineArrowLeft />
          Back home
        </Link>
        <span
          className="text-lg font-bold tracking-tight"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          GATE<span style={{ color: COLORS.granted }}>/</span>PASS
        </span>
      </nav>

      {/* ---------------- FORM AREA ---------------- */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">

          {/* Mode toggle */}
          <div
            className="relative flex rounded-full p-1 mb-8"
            style={{ background: 'rgba(245,241,232,0.06)' }}
          >
            {['login', 'signup'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className="relative flex-1 py-2.5 text-sm font-semibold rounded-full z-10 transition-colors"
                style={{
                  color: mode === m ? COLORS.ink : COLORS.sage,
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                {mode === m && (
                  <motion.span
                    layoutId="authToggle"
                    className="absolute inset-0 rounded-full -z-10"
                    style={{ background: COLORS.paper }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <h1
                className="text-2xl md:text-3xl font-bold mb-2"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {mode === 'login' ? 'Welcome back.' : 'Register an account.'}
              </h1>
              <p className="text-sm mb-8" style={{ color: COLORS.sage, fontFamily: 'Inter, system-ui, sans-serif' }}>
                {mode === 'login'
                  ? 'Sign in to manage gate passes and view activity.'
                  : 'Tell us who you are — we\'ll set up your access.'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Name — signup only */}
                {mode === 'signup' && (
                  <Field
                    icon={<HiOutlineUser size={18} />}
                    type="text"
                    placeholder="Full name"
                    value={name}
                    onChange={setName}
                    required
                  />
                )}

                {/* Email — both */}
                <Field
                  icon={<HiOutlineMail size={18} />}
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={setEmail}
                  required
                />

                {/* Password — both */}
                <Field
                  icon={<HiOutlineLockClosed size={18} />}
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={setPassword}
                  required
                />

                {/* Type — signup only */}
                {mode === 'signup' && (
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-widest mb-3"
                      style={{ color: COLORS.sage }}
                    >
                      I am a
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {userTypes.map((opt) => (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() => setType(opt.value)}
                          className="relative py-3 rounded-xl text-sm font-medium border transition-colors"
                          style={{
                            borderColor: type === opt.value ? COLORS.granted : 'rgba(245,241,232,0.15)',
                            background: type === opt.value ? 'rgba(63,166,107,0.12)' : 'transparent',
                            color: type === opt.value ? COLORS.granted : COLORS.paper,
                            fontFamily: 'Inter, system-ui, sans-serif',
                          }}
                        >
                          {type === opt.value && (
                            <BsCheckCircleFill
                              className="absolute top-1.5 right-1.5"
                              size={12}
                              style={{ color: COLORS.granted }}
                            />
                          )}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <p
                    className="text-sm px-4 py-2.5 rounded-lg"
                    style={{ background: 'rgba(194,75,63,0.12)', color: COLORS.denied }}
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-base mt-2 transition-transform hover:scale-[1.01] disabled:opacity-60"
                  style={{ background: COLORS.paper, color: COLORS.ink, fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                  {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
                  {!loading && <BsArrowRight />}
                </button>
              </form>

              <p
                className="text-center text-sm mt-6"
                style={{ color: COLORS.sage, fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
                <button
                  onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                  className="font-semibold underline-offset-4 hover:underline"
                  style={{ color: COLORS.paper }}
                >
                  {mode === 'login' ? 'Create one' : 'Sign in'}
                </button>
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// Reusable input field with leading icon
const Field = ({ icon, type, placeholder, value, onChange, required }) => (
  <div
    className="flex items-center gap-3 rounded-xl px-4 py-3.5 border focus-within:border-opacity-60 transition-colors"
    style={{ borderColor: 'rgba(245,241,232,0.15)', background: 'rgba(245,241,232,0.04)' }}
  >
    <span style={{ color: '#9CA89C' }}>{icon}</span>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full bg-transparent outline-none text-sm placeholder:text-[#9CA89C]"
      style={{ color: COLORS.paper, fontFamily: 'Inter, system-ui, sans-serif' }}
    />
  </div>
);

export default AuthPage;