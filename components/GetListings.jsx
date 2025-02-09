'use client';

import { scrapeGoogleMaps } from '@/lib/actions/scrapeGoogleMaps';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Copy } from 'lucide-react'; // Import the copy icon

export default function GetListings() {
  const [results, setResults] = useState(null);
  const [pending, setPending] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const formatForSheets = (data) => {
    // Headers for the spreadsheet
    const headers = [
      'Business Name',
      'Rating',
      'Review Count',
      'Service Category',
      'Address',
      'Phone Number',
      'Website URL',
    ].join('\t');

    // Format each row of data
    const rows = data.map((item) =>
      [
        item.business_name || '',
        item.rating || '',
        item.review_count || '',
        item.service_category || '',
        item.address || '',
        item.phone_number || '',
        item.website_url || '',
      ].join('\t')
    );

    // Combine headers and rows
    return [headers, ...rows].join('\n');
  };

  const copyToClipboard = async () => {
    if (!results) return;

    try {
      const formattedData = formatForSheets(results);
      await navigator.clipboard.writeText(formattedData);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const onSubmit = async (data) => {
    setPending(true);
    const { query } = data;

    try {
      const listings = await scrapeGoogleMaps(query);
      setResults(listings);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      //Clear the input field after submission
      document.querySelector('input[name="query"]').value = '';
      setPending(false);
    }
  };

  return (
    <div className="text-center">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl tracking-tight font-black pb-6">
          Scrape Google Maps for Valuable Business Data
        </h1>
      </div>
      <div className="max-w-3xl mx-auto">
        <p className="pb-6">
          Extract information from Google Maps listings. Just enter a query below to get started.
          For example, you can enter "restaurants in New York" to get a list of restaurants in New
          York City.
        </p>

        <p className="text-sm text-gray-500 pb-6">
          Note: This tool is for educational purposes only. Please respect the terms of service of
          Google Maps and use this tool responsibly.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mb-10">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Enter your query here..."
              {...register('query', { required: true })}
              className="border border-gray-300 rounded-md px-4 py-2 flex-grow"
            />
            <button type="submit" className="bg-black text-white px-4 py-2 rounded-md">
              {pending ? 'Scraping...' : 'Get Listings'}
            </button>
          </div>
          {errors.query && <span className="text-red-500">This field is required</span>}
        </form>
      </div>
      {/* Display the results */}
      {/* {results && (
          <div className="mt-10 text-left">
            <h2 className="text-2xl font-bold mb-4">Results</h2>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {results.map((listing, index) => (
                <li key={index} className="mb-6">
                  <strong>{listing.business_name}</strong>
                  <p>Rating: {listing.rating}</p>
                  <p>Review Count: {listing.review_count}</p>
                  <p>Service Category: {listing.service_category}</p>
                  <p>Address: {listing.address}</p>
                  <p>Operating Hours: {listing.operating_hours}</p>
                  <p>Phone Number: {listing.phone_number}</p>
                  <p>
                    Website URL:
                    {listing.website_url ? (
                      <a
                        href={listing.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500"
                      >
                        Go to Website
                      </a>
                    ) : (
                      ' No website available'
                    )}
                  </p>
                </li>
              ))}
            </ul>
       
            <pre className="text-left">{JSON.stringify(results, null, 2)}</pre>
          </div>
        )} */}
      {results && (
        <div className="mt-10 text-left px-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Results</h2>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <Copy size={16} />
              {copySuccess ? 'Copied!' : 'Copy for Sheets'}
            </button>
          </div>

          {/* Table view of results */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2">Business Name</th>
                  <th className="border p-2">Rating</th>
                  <th className="border p-2">Reviews</th>
                  <th className="border p-2">Category</th>
                  <th className="border p-2">Address</th>
                  <th className="border p-2">Phone</th>
                  <th className="border p-2">Website</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border p-2">{item.business_name}</td>
                    <td className="border p-2">{item.rating}</td>
                    <td className="border p-2">{item.review_count}</td>
                    <td className="border p-2">{item.service_category}</td>
                    <td className="border p-2">{item.address}</td>
                    <td className="border p-2">{item.phone_number}</td>
                    <td className="border p-2">
                      {item.website_url ? (
                        <a
                          href={item.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500"
                        >
                          Link
                        </a>
                      ) : (
                        ' No link'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
