'use client'; // This component needs client-side interactivity

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { scrapeAndCalculate } from '@/lib/actions/getMapsPosition';
import { categories } from '@/lib/data';
import Loading from '@/components/Loading';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset, // Add reset to clear form if needed
  } = useForm();

  const onSubmit = async (formData) => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    console.log('Form Data Submitted:', formData);

    try {
      const response = await scrapeAndCalculate(formData); // Call the server action

      if (response.success) {
        setResults(response.data);
        console.log('Server Action Success:', response.data);
        // reset(); // Optionally reset form on success
      } else {
        setError(response.error || 'An unknown error occurred.');
        console.error('Server Action Error:', response.error);
      }
    } catch (err) {
      // Catch errors during the fetch/action call itself
      setError('Failed to execute the action. Check network or server logs.');
      console.error('Client-side Action Call Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Google Maps Position & Revenue Opportunity
        </h1>
        <p className="text-lg text-base-content/80 max-w-3xl mx-auto">
          Enter a Google Maps search, target business, category, and average
          revenue to find its ranking and estimate the potential monthly revenue
          opportunity.
        </p>
      </div>

      {/* Form Section */}
      <div className="max-w-3xl mx-auto card bg-base-100 shadow-xl p-6 md:p-8">
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
              defaultValue="" // Ensures the placeholder is shown initially
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
                valueAsNumber: true, // Convert input to number
                min: { value: 0.01, message: 'Amount must be positive.' },
              })}
              className={`input input-bordered w-full ${
                errors.avgDollarAmount ? 'input-error' : ''
              }`}
              step="0.01" // Allow decimals
              min="0"
            />
            {errors.avgDollarAmount && (
              <span className="text-error text-sm mt-1">
                {errors.avgDollarAmount.message}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Scraping & Calculating...
              </>
            ) : (
              'Find Position & Calculate Opportunity'
            )}
          </button>
        </form>
      </div>

      {/* Loading State */}
      {isLoading && <Loading />}

      {/* Error Display */}
      {error && !isLoading && (
        <div className="alert alert-error shadow-lg max-w-3xl mx-auto mt-8">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current flex-shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Error! {error}</span>
          </div>
        </div>
      )}

      {/* Results Display */}
      {results && !isLoading && !error && (
        <div className="card bg-base-100 shadow-xl max-w-3xl mx-auto mt-8 p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Results</h2>

          <div className="space-y-4">
            <p>
              <strong>Search Query:</strong> {results.searchQuery}
            </p>
            <p>
              <strong>Target Business:</strong> {results.targetBusiness}
            </p>
            <p>
              <strong>Category:</strong> {results.category}
            </p>
            <p>
              <strong>Avg. Revenue/Customer:</strong> $
              {results.avgDollarAmount?.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>

            <div className="divider"></div>

            <p className="text-lg">
              <strong>Position in Maps List:</strong>{' '}
              <span className="font-bold text-primary">{results.position}</span>
            </p>
            <p className="text-sm text-base-content/70">
              (Based on {results.totalListingsScraped} total listings found)
            </p>

            {results.potentialMonthlyRevenue !== null && (
              <div className="mt-4 p-4 bg-primary/10 rounded-md">
                <p className="font-semibold text-lg">
                  Estimated Potential Monthly Revenue (if in Top 3):
                </p>
                <p className="text-3xl font-bold text-primary my-2">
                  $
                  {results.potentialMonthlyRevenue?.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                {/* Render the calculation notes HTML */}
                <div
                  className="text-sm text-base-content/80 mt-2 space-y-1"
                  dangerouslySetInnerHTML={{ __html: results.calculationNotes }}
                />
              </div>
            )}

            <div className="divider"></div>

            <h3 className="text-lg font-semibold">Top 5 Businesses Found:</h3>
            {results.listingsFound && results.listingsFound.length > 0 ? (
              <ul className="list-decimal list-inside space-y-1 text-base-content/90">
                {results.listingsFound.map((name, index) => (
                  <li key={index}>{name}</li>
                ))}
              </ul>
            ) : (
              <p className="text-base-content/70 italic">
                No specific business names could be extracted.
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
