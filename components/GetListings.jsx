'use client';

import { scrapeGoogleMaps } from '@/lib/actions/scrapeGoogleMaps';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';

export default function GetListings() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    const { query } = data;

    try {
      const listings = await scrapeGoogleMaps(query);
      setResults(listings);

      // Save the results and query to local storage
      localStorage.setItem('results', JSON.stringify(listings));
      localStorage.setItem('query', query);

      router.push('/scraped-results');
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      //Clear the input field after submission
      document.querySelector('input[name="query"]').value = '';
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
            Extract information from Google Maps listings. Just enter a query below to get started.
            For example, you can enter "restaurants in New York" to get a list of restaurants in New
            York City.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mb-10">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="e.g. Plumbers in Waco"
                {...register('query', { required: true })}
                className="border border-gray-300 rounded-md px-4 py-2 flex-grow"
              />
              <button type="submit" className="bg-black text-white px-4 py-2 rounded-md">
                Scrape data
              </button>
            </div>
            {errors.query && <span className="text-red-500">Please enter a search query</span>}
          </form>
        </div>
      </div>
    </>
  );
}
