import { Compass } from 'lucide-react';
import Link from 'next/link';
export default function Logo() {
  return (
    <Link href="/" className="logo">
      <span className="logo-mark">
        <Compass size={23} />
      </span>
      <span>roamly</span>
    </Link>
  );
}
