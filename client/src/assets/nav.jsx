import React from 'react';
import { NavLink } from 'react-router-dom';
import { HiOutlineQrcode, HiOutlineUser } from 'react-icons/hi';

const COLORS = {
  ink: '#0B1F17',
  paper: '#F5F1E8',
  granted: '#3FA66B',
  sage: '#9CA89C',
};

const navItems = [
  { to: '/qrcode', label: 'My vehicles', icon: HiOutlineQrcode },
  { to: '/profile', label: 'Profile', icon: HiOutlineUser },
];

const Nav = () => {
  return (
    <nav
      className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-12 py-5 border-b"
      style={{ background: COLORS.ink, borderColor: 'rgba(245,241,232,0.08)' }}
    >
      <span
        className="text-lg font-bold tracking-tight"
        style={{ fontFamily: 'Georgia, serif', color: COLORS.paper }}
      >
        GATE<span style={{ color: COLORS.granted }}>/</span>PASS
      </span>

      <div className="flex items-center gap-1 rounded-full p-1" style={{ background: 'rgba(245,241,232,0.06)' }}>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive ? '' : 'hover:opacity-80'
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? COLORS.paper : 'transparent',
              color: isActive ? COLORS.ink : COLORS.sage,
              fontFamily: 'Inter, system-ui, sans-serif',
            })}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Nav;









