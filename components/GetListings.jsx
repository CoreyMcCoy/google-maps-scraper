'use client';

import { scrapeGoogleMaps } from '@/lib/actions/scrapeGoogleMaps';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';
import businessCategoriesData from '@/data/businessCategories.json';

export default function GetListings() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Extract the business categories array from the imported JSON
  const validCategories = businessCategoriesData['business categories'];

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    const { query } = data;

    // **Extract potential category (basic - first word/words before location keywords)**
    const locationKeywords = ['in', 'near', 'around', 'close to'];
    let categoryPart = query;
    for (const keyword of locationKeywords) {
      const keywordIndex = query.toLowerCase().indexOf(keyword);
      if (keywordIndex !== -1) {
        categoryPart = query.substring(0, keywordIndex).trim();
        break;
      }
    }
    if (!categoryPart) {
      categoryPart = query;
    }

    // **Validation Logic: Case-insensitive check of extracted category part**
    const lowerCaseValidCategories = validCategories.map((cat) =>
      cat.toLowerCase()
    ); // Lowercase valid categories for comparison
    if (!lowerCaseValidCategories.includes(categoryPart.toLowerCase())) {
      // Case-insensitive includes
      setError('query', {
        type: 'manual',
        message: 'Invalid business category. Please choose from the list.',
      });
      setLoading(false);
      return;
    } else {
      clearErrors('query');
    }

    try {
      const listings = await scrapeGoogleMaps(query);

      // Save the results and query to local storage
      localStorage.setItem('results', JSON.stringify(listings));
      localStorage.setItem('query', query);

      router.push('/scraped-results');
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <div className="text-center">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-6xl tracking-tight font-black pb-6">
            Scrape valuable business data from Google Maps listings.
          </h1>
        </div>
        <div className="max-w-3xl mx-auto">
          <p className="pb-10">
            Extract information from Google Maps listings. Just enter a query
            below to get started. For example, you can enter "restaurants in New
            York" to get a list of restaurants in New York City.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mb-10">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                id="query"
                placeholder="e.g. Plumbers in Waco"
                {...register('query', {
                  required: 'Query must be business related.',
                })}
                className="border border-gray-300 rounded-md px-4 py-2 flex-grow"
              />
              <button
                type="submit"
                className="bg-black text-white px-4 py-2 rounded-md"
              >
                Scrape data
              </button>
            </div>
            <div className="mt-4">
              {errors.query && (
                <span className="text-red-500 error-message">
                  {errors.query.message}
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
