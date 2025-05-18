import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="navbar py-4">
      <nav className="container flex items-center justify-between">
        {/* Mobile view */}
        <div className="navbar-start flex">
          <Link href="/" className="font-semibold">
            <div className="hidden md:flex">
              <h3 className="text-lg font-bold">Google Maps Scraper</h3>
            </div>
            <div className="md:hidden">
              <Image
                src="/saas-app-icon.png"
                alt="Google Maps Scraper Logo"
                width={40}
                height={40}
                priority
                className="rounded-md"
              />
            </div>
          </Link>
          <div className="dropdown ml-2">
            <div tabIndex={0} role="button" className="btn btn-ghost md:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h8m-8 6h16"
                />
              </svg>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content font-medium mt-3 z-[1] px-2 py-3 shadow-lg border rounded-box w-52"
            >
              <li>
                <Link href="/audit-result">One</Link>
              </li>
              <li>
                <Link href="/scraped-results">Many</Link>
              </li>
            </ul>
          </div>
          {/* End mobile view */}
        </div>

        {/* Desktop view */}
        <div className="navbar-end hidden md:flex">
          <ul className="menu menu-horizontal space-x-2">
            <li>
              <Link href="/audit-result">One</Link>
            </li>
            <li>
              <Link href="/scraped-results">Many</Link>
            </li>
          </ul>
        </div>
        {/* End desktop view */}
      </nav>
    </header>
  );
}
