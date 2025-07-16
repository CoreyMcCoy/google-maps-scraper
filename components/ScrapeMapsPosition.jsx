'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { scrapeAndCalculate } from '@/lib/actions/getMapsPosition';
import { categories } from '@/lib/data';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = async (formData) => {
    setIsLoading(true);
    setError(null);
    setResults(null); // Clear previous results before new search

    console.log('Form Data Submitted:', formData);
    try {
      const response = await scrapeAndCalculate(formData);

      if (response.success) {
        setResults(response.data);
        console.log('Server Action Success:', response.data);
        try {
          localStorage.setItem('auditResults', JSON.stringify(response.data));
          console.log('Results saved to localStorage');
          // Redirect to the audit-result page
          router.push('/audit-result');
        } catch (e) {
          console.warn('Failed to save results to localStorage:', e);
        }
        // reset(); // Optionally reset form on success
      } else {
        setError(response.error || 'An unknown error occurred.');
        console.error('Server Action Error:', response.error);
      }
    } catch (err) {
      setError('Failed to execute the action. Check network or server logs.');
      console.error('Client-side Action Call Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <div className="text-center">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
            Audit a business.
          </h1>
        </div>

        <p className="text-lg text-base-content/80 max-w-3xl mx-auto">
          Get the business's position in the Map Pack, and if they don't rank in
          the top 3, estimate the potential monthly revenue they're missing out
          on.
        </p>

        <div className="max-w-3xl mx-auto p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Search Query */}
            <div>
              <label htmlFor="searchQuery" className="label">
                <span className="label-text font-semibold">
                  Google Maps Search Query
                </span>
              </label>
              <input
                type="text"
                id="searchQuery"
                placeholder="e.g., plumbers in waco"
                {...register('searchQuery', {
                  required: 'Search query is required.',
                })}
                className={`input input-bordered w-full ${
                  errors.searchQuery ? 'input-error' : ''
                }`}
              />
              {errors.searchQuery && (
                <span className="text-error text-sm mt-1">
                  {errors.searchQuery.message}
                </span>
              )}
            </div>

            {/* Target Business Name */}
            <div>
              <label htmlFor="targetBusinessName" className="label">
                <span className="label-text font-semibold">
                  Exact Business Name to Find
                </span>
              </label>
              <input
                type="text"
                id="targetBusinessName"
                placeholder="e.g., Select Plumbing"
                {...register('targetBusinessName', {
                  required: 'Target business name is required.',
                })}
                className={`input input-bordered w-full ${
                  errors.targetBusinessName ? 'input-error' : ''
                }`}
              />
              {errors.targetBusinessName && (
                <span className="text-error text-sm mt-1">
                  {errors.targetBusinessName.message}
                </span>
              )}
            </div>

            {/* Category Dropdown */}
            <div>
              <label htmlFor="category" className="label">
                <span className="label-text font-semibold">
                  Business Category
                </span>
              </label>
              <select
                id="category"
                {...register('category', {
                  required: 'Please select a category.',
                })}
                className={`select select-bordered w-full ${
                  errors.category ? 'select-error' : ''
                }`}
                defaultValue=""
              >
                <option value="" disabled>
                  -- Select Category --
                </option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && (
                <span className="text-error text-sm mt-1">
                  {errors.category.message}
                </span>
              )}
            </div>

            {/* Average Dollar Amount */}
            <div>
              <label htmlFor="avgDollarAmount" className="label">
                <span className="label-text font-semibold">
                  Average Revenue per Customer ($)
                </span>
              </label>
              <input
                type="number"
                id="avgDollarAmount"
                placeholder="e.g., 150"
                {...register('avgDollarAmount', {
                  required: 'Average revenue is required.',
                  valueAsNumber: true,
                  min: { value: 0.01, message: 'Amount must be positive.' },
                })}
                className={`input input-bordered w-full ${
                  errors.avgDollarAmount ? 'input-error' : ''
                }`}
                step="0.01"
                min="0"
              />
              {errors.avgDollarAmount && (
                <span className="text-error text-sm mt-1">
                  {errors.avgDollarAmount.message}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="bg-black text-white px-4 py-3 rounded-md w-full hover:bg-black"
            >
              Audit business
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
