'use client';

import { useState } from 'react';
import GetListings from '@/components/GetListings';
import ScrapeMapsPosition from '@/components/ScrapeMapsPosition';

export default function Home() {
  const [showForm, setShowForm] = useState(true);

  const handleToggle = () => {
    setShowForm((prev) => !prev); // Flip the state
  };

  return (
    <>
      <div className="mb-8 text-right text-sm">
        <fieldset className="fieldset w-auto border px-4 mb-10 md:mb-0 bg-white rounded-box inline-block">
          <legend className="fieldset-legend px-2">Scraping?</legend>
          <label className="label cursor-pointer flex items-center justify-between">
            <span className="label-text mr-2">One</span>
            <input
              type="checkbox"
              checked={showForm}
              onChange={handleToggle}
              className="toggle toggle-sm text-base-content"
            />
            <span className="label-text ml-2">Many</span>
          </label>
        </fieldset>

        {/* Conditionally Rendered Component */}
        {showForm ? <GetListings /> : <ScrapeMapsPosition />}
      </div>
    </>
  );
}
