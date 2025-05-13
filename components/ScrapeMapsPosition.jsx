'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { scrapeAndCalculate } from '@/lib/actions/getMapsPosition';
import { categories } from '@/lib/data';
// import Loading from '@/components/Loading'; // Removed as it's not used

const LOCAL_STORAGE_KEY = 'gmapsCalculatorResult';

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
      <p className="mb-3 text-base-content/90">
        {messageIntro} The figure of{' '}
        <strong className="text-primary">{formattedRevenue}/month</strong>{' '}
        represents the estimated total revenue generated across the Top 3 spots
        based on these assumptions.
      </p>
    );
  } else if (typeof position === 'number') {
    messageIntro = `Your business, "${targetBusinessName}", is currently at Position ${position}.`;
    return (
      <p className="mb-3 text-base-content/90">
        {messageIntro} You could be leaving about{' '}
        <strong className="text-primary">{formattedRevenue}/month</strong> on
        the table by not being in the Top 3.
      </p>
    );
  } else {
    // Not Found or N/A (e.g., "Not Found", "N/A (No target specified)")
    messageIntro = `The target business, "${targetBusinessName}", was ${position
      .toString()
      .toLowerCase()}.`;
    return (
      <p className="mb-3 text-base-content/90">
        {messageIntro} Businesses in the Top 3 for this type of search could be
        generating around{' '}
        <strong className="text-primary">{formattedRevenue}/month</strong>.
      </p>
    );
  }
};

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue, // Added to potentially load from localStorage
  } = useForm();

  // Optional: Load previous results from localStorage on component mount
  // You can also use this to pre-fill the form if you save form data too.
  useEffect(() => {
    try {
      const savedResults = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedResults) {
        const parsedResults = JSON.parse(savedResults);
        setResults(parsedResults);
        // Optionally pre-fill form fields if desired:
        // setValue('searchQuery', parsedResults.searchQuery);
        // setValue('targetBusinessName', parsedResults.targetBusiness);
        // setValue('category', parsedResults.category);
        // setValue('avgDollarAmount', parsedResults.avgDollarAmount);
        console.log('Loaded previous results from localStorage');
      }
    } catch (e) {
      console.warn('Failed to load results from localStorage:', e);
      // Clear corrupted data if parsing fails
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [setValue]);

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
          localStorage.setItem(
            LOCAL_STORAGE_KEY,
            JSON.stringify(response.data)
          );
          console.log('Results saved to localStorage');
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

  return (
    <main className="container mx-auto p-4 md:p-8">
      {/* Header Section (unchanged) */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
          Google Maps Position & Revenue Opportunity
        </h1>
        <p className="text-lg text-base-content/80 max-w-3xl mx-auto">
          Enter a Google Maps search, target business, category, and average
          revenue to find its ranking and estimate the potential monthly revenue
          opportunity.
        </p>
      </div>

      {/* Form Section (unchanged) */}
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
            className="btn bg-black text-white w-full hover:bg-black"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Scraping & Calculating...
              </>
            ) : (
              'Audit'
            )}
          </button>
        </form>
      </div>

      {/* Error Display (unchanged) */}
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

      {/* Results Display - MODIFIED SECTION */}
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
              (Based on {results.totalListingsScraped.toLocaleString()} total
              listings found)
            </p>

            {/* Display Potential Revenue and Calculation Breakdown */}
            {results.potentialMonthlyRevenue !== null &&
              results.calculationDetails && (
                <div className="mt-4 p-4 bg-primary/10 rounded-md">
                  <p className="font-semibold text-lg">
                    Estimated Potential Monthly Revenue (if in Top 3):
                  </p>
                  <p className="text-3xl font-bold text-primary my-2">
                    {results.potentialMonthlyRevenue?.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    })}
                  </p>

                  {results.calculationDetails.error ? (
                    <p className="text-error">
                      {results.calculationDetails.error}
                    </p>
                  ) : (
                    results.calculationDetails.inputs &&
                    results.calculationDetails.derived && (
                      <div className="text-sm text-base-content/80 mt-2 space-y-1">
                        <RevenueContextMessage
                          position={results.position}
                          potentialMonthlyRevenue={
                            results.potentialMonthlyRevenue
                          }
                          targetBusinessName={results.targetBusiness}
                        />

                        <p className="mt-4 font-semibold">
                          Here’s how we calculated it:
                        </p>
                        <ul className="list-disc list-inside space-y-1 pl-4">
                          <li>
                            {results.calculationDetails.inputs.searchVolume.toLocaleString()}{' '}
                            people search for "
                            {results.calculationDetails.inputs.category}"
                            locally each month.
                          </li>
                          <li>
                            {Math.round(
                              results.calculationDetails.inputs.avgCtrTop3 * 100
                            )}
                            % click the top 3 results (
                            {results.calculationDetails.derived.potentialClicks.toLocaleString()}{' '}
                            clicks).
                          </li>
                          <li>
                            We estimate{' '}
                            {Math.round(
                              results.calculationDetails.inputs
                                .clickToLeadRate * 100
                            )}
                            % of clicks become leads (
                            {results.calculationDetails.derived.potentialLeads.toLocaleString()}{' '}
                            leads).
                          </li>
                          <li>
                            And{' '}
                            {Math.round(
                              results.calculationDetails.inputs
                                .leadToCustomerRate * 100
                            )}
                            % of leads turn into customers (
                            {results.calculationDetails.derived.potentialCustomers.toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1,
                              }
                            )}{' '}
                            customers).
                          </li>
                        </ul>
                        {results.calculationDetails.disclaimer && (
                          <p className="italic mt-3">
                            {results.calculationDetails.disclaimer}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            {/* Handle case where calculation could not be performed at all */}
            {results.potentialMonthlyRevenue === null &&
              results.calculationDetails &&
              results.calculationDetails.error && (
                <div className="mt-4 p-4 bg-warning/10 rounded-md text-warning-content">
                  <p className="font-semibold">Revenue Calculation Note:</p>
                  <p>{results.calculationDetails.error}</p>
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
                No specific business names could be extracted from the top
                results, or the target was not in the top results shown.
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
