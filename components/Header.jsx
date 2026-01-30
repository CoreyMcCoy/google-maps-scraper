import Link from 'next/link';

export default function Header() {
  return (
    <header className="max-w-7xl mx-auto py-8 px-4">
      <nav className="flex items-center justify-between">
        <h3 className="md:text-lg font-bold">Google Maps Scraper</h3>
        <ul className="flex space-x-4 text-sm">
          <li>
            <Link href="/audit-result">One</Link>
          </li>
          <li>
            <Link href="/scraped-results">Many</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
