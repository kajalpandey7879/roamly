'use client';

import { ChevronDown, Globe2, Instagram } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const INSPIRATION = {
  Popular: [
    ['Manali', 'Cabin rentals'],
    ['Santorini', 'Cave houses'],
    ['Bellagio', 'Lakefront homes'],
    ['Marrakesh', 'Riad rentals'],
    ['Uluwatu', 'Villa rentals'],
    ['Rovaniemi', 'Arctic cabins'],
    ['New York', 'Loft rentals'],
    ['Vancouver Island', 'Treehouses'],
    ['Puducherry', 'Beach homes'],
    ['Goa', 'Holiday rentals'],
    ['London', 'Apartment rentals'],
    ['Tokyo', 'Unique stays'],
  ],
  Beach: [
    ['Goa', 'Beach houses'],
    ['Uluwatu', 'Oceanfront villas'],
    ['Maldives', 'Island stays'],
    ['Alibaug', 'Beach cottages'],
    ['Bali', 'Private villas'],
    ['Gulf Shores', 'Cottage rentals'],
  ],
  Mountains: [
    ['Manali', 'Mountain cabins'],
    ['Rovaniemi', 'Snow stays'],
    ['Aspen', 'Ski homes'],
    ['Shimla', 'Cottage rentals'],
    ['Interlaken', 'Chalet rentals'],
    ['Banff', 'Cabin rentals'],
  ],
  Outdoors: [
    ['Vancouver Island', 'Treehouses'],
    ['Lake Como', 'Waterfront stays'],
    ['Coorg', 'Nature lodges'],
    ['Wayanad', 'Forest homes'],
    ['Sedona', 'Desert homes'],
    ['Queenstown', 'Adventure stays'],
  ],
} as const;

const FOOTER_GROUPS = [
  [
    'Support',
    'Help Centre',
    'Get help with a safety issue',
    'Accessibility support',
    'Cancellation options',
    'Report a neighbourhood concern',
  ],
  [
    'Hosting',
    'Roamly your home',
    'Hosting resources',
    'Community forum',
    'Hosting responsibly',
    'Find a co-host',
  ],
  ['Roamly', 'Newsroom', 'Careers', 'Investors', 'Gift cards', 'Emergency stays'],
] as const;

export default function Footer() {
  const [activeTab, setActiveTab] = useState<keyof typeof INSPIRATION>('Popular');
  const [showAll, setShowAll] = useState(false);
  const destinations = INSPIRATION[activeTab];
  return (
    <footer className="site-footer">
      <section className="footer-inspiration">
        <h2>Inspiration for future getaways</h2>
        <div className="inspiration-tabs">
          {Object.keys(INSPIRATION).map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? 'active' : ''}
              onClick={() => {
                setActiveTab(tab as keyof typeof INSPIRATION);
                setShowAll(false);
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="destination-links">
          {destinations.slice(0, showAll ? destinations.length : 6).map(([city, type]) => (
            <Link href={`/?location=${encodeURIComponent(city)}`} key={city}>
              <b>{city}</b>
              <span>{type}</span>
            </Link>
          ))}
        </div>
        {destinations.length > 6 && (
          <button className="show-destinations" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Show less' : 'Show more'}{' '}
            <ChevronDown size={14} className={showAll ? 'rotated' : ''} />
          </button>
        )}
      </section>
      <section className="footer-groups">
        {FOOTER_GROUPS.map(([title, ...links]) => (
          <div key={title}>
            <h3>{title}</h3>
            {links.map((label) => (
              <Link href="#" key={label}>
                {label}
              </Link>
            ))}
          </div>
        ))}
      </section>
      <div className="footer-bottom">
        <div>
          <span>&copy; {new Date().getFullYear()} Roamly, Inc.</span>
          <Link href="#">Privacy</Link>
          <Link href="#">Terms</Link>
          <Link href="#">Company details</Link>
        </div>
        <div>
          <button>
            <Globe2 size={15} /> English (IN)
          </button>
          <button>$ USD</button>
          <Link href="#" aria-label="Instagram">
            <Instagram size={17} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
