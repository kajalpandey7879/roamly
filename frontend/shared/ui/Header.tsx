'use client';
import Link from 'next/link';
import { Gift, Globe2, HelpCircle, House, Menu, Moon, Search, UsersRound } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import SearchBar from '@/features/explore/components/SearchBar';
import { useAuth } from '@/features/auth/AuthProvider';
import Logo from './Logo';
import LanguageRegionModal from './LanguageRegionModal';
import { Suspense, useState } from 'react';
import toast from 'react-hot-toast';
import { useTheme } from '@/features/theme/ThemeProvider';
export default function Header() {
  const [open, setOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn, requestLogin, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const isCollectionPage = pathname.startsWith('/collections/');
  const isListingPage = pathname.startsWith('/listings/');
  const isCheckoutPage = pathname === '/checkout';
  const isLoginPage = pathname === '/login';
  const hasCompactSearch = isCollectionPage || isListingPage;

  function continueToHosting() {
    setOpen(false);
    router.push(user?.role === 'host' ? '/host' : '/host?create=1');
  }

  function becomeHost() {
    if (isLoggedIn) continueToHosting();
    else {
      setOpen(false);
      requestLogin('/host?create=1');
    }
  }
  if (isCheckoutPage || isLoginPage)
    return (
      <header className="header checkout-site-header">
        <div className="header-inner">
          <Logo />
        </div>
      </header>
    );
  return (
    <>
      <header
        className={`header${hasCompactSearch ? ' collection-site-header' : ''}${isListingPage ? ' listing-site-header' : ''}`}
      >
        <div className="header-inner">
          <Logo />
          {isCollectionPage ? (
            <Suspense fallback={<div className="collection-search-placeholder" />}>
              <SearchBar variant="header" searchPath={pathname} />
            </Suspense>
          ) : isListingPage ? (
            <Link className="collection-compact-search" href="/">
              <span>
                <House size={17} /> Anywhere
              </span>
              <span>Anytime</span>
              <span>Add guests</span>
              <b>
                <Search size={16} />
              </b>
            </Link>
          ) : (
            <nav className="desktop-nav marketplace-nav" aria-label="Marketplace sections">
              <Link className="active" href="/">
                <span aria-hidden="true">🏡</span>
                Homes
              </Link>
              <button onClick={() => toast('Experiences are coming soon')}>
                <span aria-hidden="true">🎈</span>
                Experiences
                <b>NEW</b>
              </button>
              <button onClick={() => toast('Services are coming soon')}>
                <span aria-hidden="true">🛎️</span>
                Services
                <b>NEW</b>
              </button>
            </nav>
          )}
          <div className="account">
            <button className="host-link" onClick={becomeHost}>
              {user?.role === 'host' ? 'Switch to hosting' : 'Become a host'}
            </button>
            <button
              className="icon-button"
              title="Choose language"
              aria-label="Choose a language and region"
              onClick={() => {
                setOpen(false);
                setLanguageOpen(true);
              }}
            >
              <Globe2 size={18} />
            </button>
            <button
              className="profile-button menu-only"
              onClick={() => setOpen(!open)}
              aria-label="Account menu"
            >
              <Menu size={18} />
            </button>
            {open && (
              <div className={`account-menu ${isLoggedIn ? 'logged-in' : 'logged-out'}`}>
                {user ? (
                  <>
                    <div className="account-menu-identity">
                      <img src={user.avatar} alt="" />
                      <span>
                        <strong>{user.name}</strong>
                        <small>{user.role === 'host' ? 'Host account' : 'Guest account'}</small>
                      </span>
                    </div>
                    <Link href="/trips" onClick={() => setOpen(false)}>
                      Trips
                    </Link>
                    <Link href="/wishlists" onClick={() => setOpen(false)}>
                      Wishlists
                    </Link>
                    {user.role === 'host' ? (
                      <Link href="/host" onClick={() => setOpen(false)}>
                        Host dashboard
                      </Link>
                    ) : (
                      <button onClick={becomeHost}>Become a host</button>
                    )}
                    <button onClick={() => toast('Help Centre is coming soon')}>
                      <HelpCircle size={18} /> Help Centre
                    </button>
                    <ThemeMenuItem theme={resolvedTheme} onToggle={toggleTheme} />
                    <hr />
                    <button
                      onClick={() => {
                        setOpen(false);
                        logout();
                      }}
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => toast('Help Centre is coming soon')}>
                      <HelpCircle size={19} /> Help Centre
                    </button>
                    <ThemeMenuItem theme={resolvedTheme} onToggle={toggleTheme} />
                    <hr />
                    <button className="menu-host-action" onClick={becomeHost}>
                      <span>
                        <strong>Become a host</strong>
                        <small>It&apos;s easy to start hosting and earn extra income.</small>
                      </span>
                      <House size={23} />
                    </button>
                    <button onClick={() => toast('Host referrals are coming soon')}>
                      <Gift size={18} /> Refer a host
                    </button>
                    <button onClick={() => toast('Co-host matching is coming soon')}>
                      <UsersRound size={18} /> Find a co-host
                    </button>
                    <hr />
                    <button
                      className="menu-login-action"
                      onClick={() => {
                        setOpen(false);
                        requestLogin();
                      }}
                    >
                      Log in or sign up
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
      {languageOpen && <LanguageRegionModal onClose={() => setLanguageOpen(false)} />}
    </>
  );
}

function ThemeMenuItem({ theme, onToggle }: { theme: 'light' | 'dark'; onToggle: () => void }) {
  return (
    <button
      className="theme-menu-item"
      onClick={onToggle}
      aria-label={`${theme === 'dark' ? 'Disable' : 'Enable'} dark mode`}
    >
      <Moon size={18} />
      <span>Dark mode</span>
      <i aria-hidden="true" className={theme === 'dark' ? 'active' : ''}>
        <b />
      </i>
    </button>
  );
}
