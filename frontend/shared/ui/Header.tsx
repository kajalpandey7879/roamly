'use client';
import Link from 'next/link';
import { Globe2, Menu, UserRound } from 'lucide-react';
import Logo from './Logo';
import { useState } from 'react';
export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="header">
      <div className="header-inner">
        <Logo />
        <nav className="desktop-nav">
          <Link href="/">Stays</Link>
          <Link href="/wishlists">Wishlists</Link>
          <Link href="/trips">Trips</Link>
        </nav>
        <div className="account">
          <Link className="host-link" href="/host">
            Roamly your home
          </Link>
          <button className="icon-button" title="Choose language">
            <Globe2 size={18} />
          </button>
          <button
            className="profile-button"
            onClick={() => setOpen(!open)}
            aria-label="Account menu"
          >
            <Menu size={18} />
            <span>
              <UserRound size={17} />
            </span>
          </button>
          {open && (
            <div className="account-menu">
              <strong>Alex Morgan</strong>
              <Link href="/trips">Trips</Link>
              <Link href="/wishlists">Wishlists</Link>
              <Link href="/host">Host dashboard</Link>
              <button onClick={() => setOpen(false)}>Close menu</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
