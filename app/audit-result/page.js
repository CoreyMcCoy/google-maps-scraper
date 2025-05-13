'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';
import Link from 'next/link';

// Helper component to display the revenue context message
const RevenueContextMessage = ({
  position,
  potentialMonthlyRevenue,
  targetBusinessName,
}) => {
  if (potentialMonthlyRevenue === null || potentialMonthlyRevenue === undefined)
    return null;

  const formattedRevenue = potentialMonthlyRevenue.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  let messageIntro;
  if (typeof position === 'number' && position <= 3) {
    messageIntro = `Your business, "${targetBusinessName}", is currently in the Top 3 (Position ${position}).`;
    return (
      <p className="mb-3 border bg-white p-4 rounded-md">
        {messageIntro} The figure of{' '}
        <strong className="text-gray-800">{formattedRevenue}/month</strong>{' '}
        represents the estimated total revenue generated across the Top 3 spots
        based on these assumptions.
      </p>
    );
  } else if (typeof position === 'number') {
    messageIntro = `Your business, "${targetBusinessName}", is currently at Position ${position}.`;
    return (
      <p className="mb-3 border bg-white p-4 rounded-md">
        {messageIntro} You could be leaving about{' '}
        <strong className="text-green-500">{formattedRevenue}/month</strong> on
        the table by not being in the Top 3.
      </p>
    );
  } else {
    // Not Found or N/A (e.g., "Not Found", "N/A (No target specified)")
    messageIntro = `The target business, "${targetBusinessName}", was ${position
      .toString()
      .toLowerCase()}.`;
    return (
      <p className="mb-3 border bg-white p-4 rounded-md">
        {messageIntro} Businesses in the Top 3 for this type of search could be
        generating around{' '}
        <strong className="text-primary">{formattedRevenue}/month</strong>.
      </p>
    );
  }
};

export default function SingleAuditResult() {
  const router = useRouter();
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedResults = localStorage.getItem('auditResults');
      if (savedResults) {
        const parsedResults = JSON.parse(savedResults);
        setResults(parsedResults);
      } else {
        // Redirect to home if no results are found
        router.push('/');
      }
    } catch (e) {
      console.warn('Failed to load results from localStorage:', e);
      // Clear corrupted data if parsing fails
      localStorage.removeItem('auditResults');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return <Loading />;
  }

  if (!results) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">No Results Found</h1>
        <p>Return to the home page to perform a search.</p>
        <Link href="/" className="btn btn-primary mt-4">
          Go to Search
        </Link>
      </div>
    );
  }

  // Format the revenue
  const formattedRevenue = results.potentialMonthlyRevenue
    ? results.potentialMonthlyRevenue.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      })
    : 'N/A';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-4xl font-black mb-4">
          {`Audit Result for "${results.targetBusiness}"`}
        </h1>
        <p className="text-gray-600">
          Search Query:{' '}
          <span className="font-medium">{results.searchQuery}</span>
        </p>
      </div>
      {/* Results Summary Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Results Summary</h2>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="border rounded-md p-4 bg-white">
            <h3 className="font-medium text-gray-700">Search Parameters</h3>
            <ul className="mt-2 space-y-1">
              <li>
                <span className="text-gray-600">Target Business:</span>{' '}
                {results.targetBusiness}
              </li>
              <li>
                <span className="text-gray-600">Category:</span>{' '}
                {results.category}
              </li>
              <li>
                <span className="text-gray-600">
                  Average Transaction Value:
                </span>{' '}
                ${results.avgDollarAmount}
              </li>
            </ul>
          </div>

          <div className="border rounded-md p-4 bg-white">
            <h3 className="font-medium text-gray-700">Position Results</h3>
            <ul className="mt-2 space-y-1">
              <li>
                <span className="text-gray-600">Position:</span>{' '}
                {results.position}
              </li>
              <li>
                <span className="text-gray-600">Total Listings Scraped:</span>{' '}
                {results.totalListingsScraped}
              </li>
              <li>
                <span className="text-gray-600">
                  Potential Monthly Revenue:
                </span>{' '}
                {formattedRevenue}
              </li>
            </ul>
          </div>
        </div>

        <RevenueContextMessage
          position={results.position}
          potentialMonthlyRevenue={results.potentialMonthlyRevenue}
          targetBusinessName={results.targetBusiness}
        />
      </div>

      {/* Top 5 Businesses Table */}

      <div>
        <h2 className="text-xl font-semibold mt-6 mb-4">
          Top 5 Businesses Found
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left">Rank</th>
                <th className="border px-4 py-2 text-left">Business Name</th>
              </tr>
            </thead>
            <tbody>
              {results.listingsFound && results.listingsFound.length > 0 ? (
                results.listingsFound.map((business, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? 'bg-gray-50' : ''}
                  >
                    <td className="border px-4 py-2">{index + 1}</td>
                    <td className="border px-4 py-2">{business}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="border px-4 py-2 text-center">
                    No businesses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>{' '}
      </div>
    </div>
  );
}
