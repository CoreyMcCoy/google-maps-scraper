'use client';

import { scrapeGoogleMaps } from '@/lib/actions/scrapeGoogleMaps';
import { useForm } from 'react-hook-form';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';
import businessCategoriesData from '@/data/businessCategories.json';

export default function GetListings() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  // Extract the business categories array from the imported JSON
  const validCategories = businessCategoriesData['business categories'];

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    setValue,
    watch,
  } = useForm();

  const queryValue = watch('query') || '';

  // Handle input change for suggestions
  useEffect(() => {
    if (queryValue) {
      setInputValue(queryValue);
      const wordBeingTyped = queryValue.split(' ').pop().toLowerCase();

      if (wordBeingTyped && wordBeingTyped.length > 1) {
        const filtered = validCategories
          .filter((cat) =>
            cat.toLowerCase().includes(wordBeingTyped.toLowerCase())
          )
          .slice(0, 5); // Limit to 5 suggestions

        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [queryValue, validCategories]);

  // Handle click outside of suggestions to close them
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    const words = inputValue.split(' ');
    words.pop(); // Remove the last word
    const newValue = [...words, suggestion].join(' ') + ' ';
    setValue('query', newValue);
    setInputValue(newValue);
    setShowSuggestions(false);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    const { query } = data;

    // Validate that the query is related to search
    if (!query || query.trim() === '') {
      setError('query', {
        type: 'manual',
        message: 'Please enter a search query.',
      });
      setLoading(false);
      return;
    }

    // // Define location keywords once
    // const locationKeywords = ['in', 'near', 'around', 'close to'];

    // // Check if query contains at least one location keyword or is specific enough
    // let hasLocationKeyword = false;
    // for (const keyword of locationKeywords) {
    //   if (query.toLowerCase().includes(` ${keyword} `)) {
    //     hasLocationKeyword = true;
    //     break;
    //   }
    // }

    // if (!hasLocationKeyword) {
    //   // If no location keyword, check if query includes city, state, or zip code format
    //   const cityStateZipPattern = /[A-Z][a-z]+(,\s*[A-Z]{2}|\s+\d{5})/;
    //   if (!cityStateZipPattern.test(query)) {
    //     setError('query', {
    //       type: 'manual',
    //       message: 'Please include a location (e.g., "plumbers in Chicago").',
    //     });
    //     setLoading(false);
    //     return;
    //   }
    // }

    // Extract potential category (first word/words before location keywords)
    let categoryPart = query;
    for (const keyword of locationKeywords) {
      const keywordIndex = query.toLowerCase().indexOf(` ${keyword} `);
      if (keywordIndex !== -1) {
        categoryPart = query.substring(0, keywordIndex).trim();
        break;
      }
    }
    if (!categoryPart) {
      categoryPart = query;
    }

    // Validation Logic: Case-insensitive check of extracted category part
    const lowerCaseValidCategories = validCategories.map((cat) =>
      cat.toLowerCase()
    ); // Lowercase valid categories for comparison

    // Check if any word in the category part matches a valid category
    const categoryWords = categoryPart.toLowerCase().split(' ');
    let isValidCategory = false;

    for (const word of categoryWords) {
      if (
        word.length > 2 &&
        lowerCaseValidCategories.some((cat) => cat.toLowerCase().includes(word))
      ) {
        isValidCategory = true;
        break;
      }
    }

    if (!isValidCategory) {
      setError('query', {
        type: 'manual',
        message: `Invalid business category. Try categories like "Fitness", "Home Services", "Roofing", "Plumbing", "Healthcare", or "Automotive".`,
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
          <h1 className="text-4xl md:text-6xl tracking-tight font-black pb-6">
            Get all listings for a search term.
          </h1>
        </div>
        <div className="max-w-3xl mx-auto">
          <p className="pb-10">
            Extract information from Google Maps listings. Just enter a query
            below to get started. For example, you can enter "HVAC in Waco" to
            get a list of HVAC companies in Waco, Texas.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mb-10">
            <div className="flex flex-col md:flex-row gap-4 relative">
              <input
                type="text"
                id="query"
                placeholder="e.g. Plumbers in Waco"
                {...register('query', {
                  required: 'Query must be business related.',
                })}
                className="input input-border border-gray-300 rounded-md px-4 py-2 flex-grow"
              />
              <button
                type="submit"
                className="bg-black text-white px-4 py-2 rounded-md"
              >
                Get listings
              </button>

              {/* Suggestions dropdown */}
              {showSuggestions && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-10 bg-white border border-gray-300 rounded-md mt-12 left-0 right-0 md:right-auto md:w-3/4"
                >
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="cursor-pointer hover:bg-gray-200 px-4 py-2 text-left"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
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
