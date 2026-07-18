'use client';
import Link from 'next/link';
import { Globe2, House, Menu, Search, UserRound } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import { useState } from 'react';
export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isCollectionPage = pathname.startsWith('/collections/');
  const isListingPage = pathname.startsWith('/listings/');
  const isCheckoutPage = pathname === '/checkout';
  const hasCompactSearch = isCollectionPage || isListingPage;
  if (isCheckoutPage)
    return (
      <header className="header checkout-site-header">
        <div className="header-inner">
          <Logo />
        </div>
      </header>
    );
  return (
    <header
      className={`header${hasCompactSearch ? ' collection-site-header' : ''}${isListingPage ? ' listing-site-header' : ''}`}
    >
      <div className="header-inner">
        <Logo />
        {hasCompactSearch ? (
          <Link className="collection-compact-search" href="/">
            <span>
              <House size={17} /> {isCollectionPage ? 'Homes in map area' : 'Anywhere'}
            </span>
            <span>{isCollectionPage ? 'Any weekend' : 'Anytime'}</span>
            <span>Add guests</span>
            <b>
              <Search size={16} />
            </b>
          </Link>
        ) : (
          <nav className="desktop-nav">
            <Link href="/">Stays</Link>
            <Link href="/wishlists">Wishlists</Link>
            <Link href="/trips">Trips</Link>
          </nav>
        )}
        <div className="account">
          <Link className="host-link" href="/host">
            {hasCompactSearch ? 'Become a host' : 'Roamly your home'}
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
