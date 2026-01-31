import Link from 'next/link';

export default function Header() {
  return (
    <header className="container py-8">
      <nav className="flex items-center justify-between">
        <Link href="/">
          <h3 className="md:text-lg font-bold">Google Maps Scraper</h3>
        </Link>
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
