import { useState } from 'react';
import { Copy, Link2, Link2Off } from 'lucide-react'; // Import the copy icon

const ScrapedListings = ({ results, query }) => {
  const [listings, setListings] = useState(results);
  const [copySuccess, setCopySuccess] = useState(false);

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
    if (!listings) return;

    try {
      const formattedData = formatForSheets(listings);
      await navigator.clipboard.writeText(formattedData);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div>
      {/* Display the results */}
      <h1 className="text-4xl tracking-tight font-black">
        {`Scraped ${listings.length} listings for "${query}"`}
      </h1>
      {listings && (
        <div className="mt-10 text-left px-2">
          <div className="flex justify-end items-center mb-4">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <Copy size={16} />
              {copySuccess ? 'Copied!' : 'Copy to Google Sheets'}
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
                    <td className="border p-2 flex justify-center">
                      {item.website_url ? (
                        <a
                          href={item.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500"
                        >
                          <Link2 size={20} />
                        </a>
                      ) : (
                        <Link2Off size={20} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Card view of results */}
      {/* {results && (
        <div className="mt-10 text-left">
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
        </div>
      )} */}
      {/* <pre className="text-left">{JSON.stringify(results, null, 2)}</pre> */}
    </div>
  );
};

export default ScrapedListings;
