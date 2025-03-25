'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';
import ScrapedListings from '@/components/ScrapedListings';

export default function ScrapedResults() {
  const router = useRouter();
  const [results, setResults] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const savedResults = localStorage.getItem('results');
    if (!savedResults) {
      router.push('/'); // Redirect to the home page if no results are found
      return;
    }
    const savedQuery = localStorage.getItem('query');

    try {
      setResults(JSON.parse(savedResults));
      setQuery(savedQuery);
    } catch (error) {
      console.error('Error parsing scraped results:', error);
      router.push('/'); // Redirect to the home page if there's an error
      return;
    }
  }, []);

  return (
    <div>
      {results ? (
        <ScrapedListings results={results} query={query} />
      ) : (
        <Loading />
      )}
    </div>
  );
}
