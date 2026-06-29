import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineQrcode, HiOutlineShieldCheck, HiOutlineClock, HiOutlineCamera } from 'react-icons/hi';
import { BsArrowRight } from 'react-icons/bs';

const COLORS = {
  ink: '#0B1F17',
  paper: '#F5F1E8',
  granted: '#3FA66B',
  denied: '#C24B3F',
  sage: '#9CA89C',
};

const barEase = [0.65, 0, 0.35, 1];

const LandingPage = () => {
  return (
    <div style={{ background: COLORS.ink, color: COLORS.paper }} className="min-h-screen overflow-x-hidden">

      {/* ---------------- NAV ---------------- */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-2">
          <span
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.02em' }}
          >
            GATE<span style={{ color: COLORS.granted }}>/</span>PASS
          </span>
        </div>
        <Link
          to="/auth"
          className="text-sm font-medium px-5 py-2 rounded-full border transition-colors hover:bg-[#F5F1E8] hover:text-[#0B1F17]"
          style={{ borderColor: 'rgba(245,241,232,0.3)' }}
        >
          Sign in
        </Link>
      </nav>

      <section className="relative px-6 md:px-12 pt-10 md:pt-16 pb-24">
        <div className="max-w-5xl mx-auto">

          <div className="relative h-20 md:h-24 mb-2 flex items-end" aria-hidden="true">
            {/* post */}
            <div
              className="absolute left-0 bottom-0 w-3 h-16 md:h-20 rounded-sm"
              style={{ background: COLORS.sage }}
            />
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: -72 }}
              transition={{ duration: 1.1, delay: 0.4, ease: barEase }}
              style={{
                originX: 0,
                originY: 1,
                background: `repeating-linear-gradient(45deg, ${COLORS.paper} 0 14px, ${COLORS.denied} 14px 28px)`,
              }}
              className="absolute left-2 bottom-14 md:bottom-[4.3rem] w-56 md:w-72 h-4 rounded-full origin-bottom-left shadow-lg"
            />
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            One scan.<br />
            Every car,<br />
            <span style={{ color: COLORS.granted }}>accounted for.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="mt-6 max-w-xl text-base md:text-lg"
            style={{ color: COLORS.sage, fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            A vehicle gate-pass system built for schools. Every staff member, student,
            and resident vehicle carries one permanent QR code. Gate officers scan it
            once at the barrier — the system handles the rest.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.6 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-base transition-transform hover:scale-[1.03]"
              style={{ background: COLORS.paper, color: COLORS.ink, fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              Get started
              <BsArrowRight />
            </Link>
            <a
              href="#how-it-works"
              className="text-sm font-medium underline-offset-4 hover:underline"
              style={{ color: COLORS.sage }}
            >
              See how it works
            </a>
          </motion.div>
        </div>
      </section>

      <section id="how-it-works" className="px-6 md:px-12 py-20" style={{ background: COLORS.paper, color: COLORS.ink }}>
        <div className="max-w-5xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-semibold tracking-[0.2em] uppercase mb-3"
            style={{ color: COLORS.granted }}
          >
            At the gate
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-14 max-w-2xl"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Two things happen at once — only one of them needs a human.
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-px" style={{ background: 'rgba(11,31,23,0.12)' }}>
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 md:p-10"
              style={{ background: COLORS.paper }}
            >
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: COLORS.sage }}>
                The driver
              </span>
              <h3 className="text-xl font-bold mt-3 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                Rolls up, holds up a phone.
              </h3>
              <p className="text-sm leading-relaxed" style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#3a3a3a' }}>
                No app to open, no form to fill, no queue at a front desk. Their QR
                code was issued once, when they registered — it works at every gate,
                every day, indefinitely.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 md:p-10"
              style={{ background: COLORS.paper }}
            >
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: COLORS.granted }}>
                The system
              </span>
              <h3 className="text-xl font-bold mt-3 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                Verifies, flips, logs.
              </h3>
              <p className="text-sm leading-relaxed" style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#3a3a3a' }}>
                The signature is checked against forgery, the vehicle's status flips
                between in and out, and the gate officer sees a name and photo —
                instantly, before the car has fully stopped.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12 py-24">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: COLORS.granted }}>
              What the officer sees
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-5" style={{ fontFamily: 'Georgia, serif' }}>
              A clear answer, not a judgment call.
            </h2>
            <p className="text-base mb-6" style={{ color: COLORS.sage, fontFamily: 'Inter, system-ui, sans-serif' }}>
              Every scan shows the registered photo, the plate, and a single
              unambiguous result. No second-guessing who's behind the wheel.
            </p>
            <ul className="space-y-3 text-sm" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              <li className="flex items-center gap-3">
                <HiOutlineQrcode style={{ color: COLORS.granted }} size={18} />
                One permanent code per vehicle
              </li>
              <li className="flex items-center gap-3">
                <HiOutlineShieldCheck style={{ color: COLORS.granted }} size={18} />
                Signed payloads — can't be faked or copied
              </li>
              <li className="flex items-center gap-3">
                <HiOutlineClock style={{ color: COLORS.granted }} size={18} />
                Full in/out history, timestamped
              </li>
            </ul>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl p-6 border"
            style={{ borderColor: 'rgba(245,241,232,0.15)', background: 'rgba(245,241,232,0.04)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs uppercase tracking-widest" style={{ color: COLORS.sage }}>
                Main gate · just now
              </span>
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: COLORS.granted, color: COLORS.ink }}
              >
                Granted
              </span>
            </div>

            <div className="flex items-center gap-4 mb-5">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg"
                style={{ background: COLORS.sage, color: COLORS.ink }}
              >
                <HiOutlineCamera size={22} />
              </div>
              <div>
                <p className="font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Mrs. A. Bello</p>
                <p className="text-xs" style={{ color: COLORS.sage }}>Staff · KJA 204 XY</p>
              </div>
            </div>

            <div className="h-px mb-5" style={{ background: 'rgba(245,241,232,0.12)' }} />

            <div className="flex items-center justify-between text-sm">
              <span style={{ color: COLORS.sage }}>Direction</span>
              <span className="font-semibold" style={{ color: COLORS.granted }}>Entering</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span style={{ color: COLORS.sage }}>Last seen</span>
              <span>Yesterday, 4:47 PM</span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-6 md:px-12 py-24 text-center" style={{ background: 'rgba(245,241,232,0.03)' }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ fontFamily: 'Georgia, serif' }}>
            Know who's on campus. Always.
          </h2>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-full font-semibold text-base transition-transform hover:scale-[1.03]"
            style={{ background: COLORS.paper, color: COLORS.ink, fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            Sign in to get started
            <BsArrowRight />
          </Link>
        </motion.div>
      </section>

      <footer className="px-6 md:px-12 py-8 text-center text-xs" style={{ color: 'rgba(245,241,232,0.4)' }}>
        Gate Pass — vehicle access control for schools.
      </footer>
    </div>
  );
};

export default LandingPage;