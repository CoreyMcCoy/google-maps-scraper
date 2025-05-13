'use server';

import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { businessData, clickToLeadRate, leadToCustomerRate } from '@/lib/data';

// Helper function for case-insensitive comparison
function namesMatchLoosely(nameFromList, targetName) {
  if (!nameFromList || !targetName) return false;
  return nameFromList
    .trim()
    .toLowerCase()
    .includes(targetName.trim().toLowerCase());
}

export async function scrapeAndCalculate(formData) {
  const { searchQuery, targetBusinessName, category, avgDollarAmount } =
    formData;

  // --- Basic Server-Side Validation ---
  if (!searchQuery || !targetBusinessName || !category || !avgDollarAmount) {
    return { success: false, error: 'All fields are required.' };
  }
  const parsedDollarAmount = parseFloat(avgDollarAmount);
  if (isNaN(parsedDollarAmount) || parsedDollarAmount < 0) {
    return { success: false, error: 'Invalid Average Dollar Amount.' };
  }

  if (!businessData[category]) {
    return { success: false, error: `Category "${category}" not found.` };
  }
  // --- End Validation ---

  let browser = null;
  let potentialMonthlyRevenue = null;
  let calculationDetailsObject = null; // This will store the structured calculation data

  console.log(
    `[Server Action] Starting scrape for: "${searchQuery}", Target: "${targetBusinessName}", Category: ${category}, Avg$: ${parsedDollarAmount}`
  );

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
    );

    const googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(
      searchQuery
    )}`;

    console.log(`Navigating to: ${googleMapsUrl}`);
    await page.goto(googleMapsUrl, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    // Auto-scroll function (remains unchanged)
    async function autoScroll() {
      await page.evaluate(async () => {
        const scrollableContainer =
          document.querySelector('div[role="feed"]') ||
          document.querySelector(
            'div[aria-label*="Results for"] > div > div[style*="overflow"]'
          );
        if (!scrollableContainer) {
          console.log(
            'Scrollable container not found. Auto-scroll might not work.'
          );
          return;
        }
        let previousHeight;
        let scrollCount = 0;
        const maxScrolls = 70; // Increased scroll attempts
        console.log('[Puppeteer] Starting auto-scroll...');
        for (let i = 0; i < maxScrolls; i++) {
          previousHeight = scrollableContainer.scrollHeight;
          scrollableContainer.scrollTop = scrollableContainer.scrollHeight;
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for content to load
          if (scrollableContainer.scrollHeight === previousHeight) {
            console.log(`Scroll height unchanged after scroll ${i + 1}.`);
            break;
          }
          scrollCount++;
          console.log(`Scrolled ${scrollCount} times...`);
        }
        console.log(
          '.Auto-scroll attempt finished after ' + scrollCount + ' scrolls.'
        );
      });
    }

    console.log('Starting auto-scroll to load more listings...');
    await autoScroll();
    console.log('Auto-scroll completed.');
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Extra wait for any lazy-loaded content

    const content = await page.content();
    const $ = cheerio.load(content);

    const businessNamesExtracted = [];
    const businessCardSelector = 'div.Nv2PK.THOPZb'; // Main selector
    const businessCards = $(businessCardSelector);
    console.log(
      `Found ${businessCards.length} elements using '${businessCardSelector}'.`
    );

    businessCards.each((index, element) => {
      const businessCard = $(element);
      const detailsContainer = businessCard.find('.lI9IFe'); // Common container for details
      const businessName = detailsContainer
        .find('.qBF1Pd.fontHeadlineSmall') // Selector for business name
        .text()
        .trim();
      if (businessName) {
        businessNamesExtracted.push(businessName);
      }
    });
    console.log(
      `[Server Action] Extracted ${businessNamesExtracted.length} business names.`
    );

    // --- Find position ---
    let foundPosition = 'Not Found'; // Default if not found or no target
    if (targetBusinessName && targetBusinessName.trim() !== '') {
      for (let i = 0; i < businessNamesExtracted.length; i++) {
        if (namesMatchLoosely(businessNamesExtracted[i], targetBusinessName)) {
          foundPosition = i + 1; // Position is 1-based
          console.log(
            `[Server Action] Target "${targetBusinessName}" found at position: ${foundPosition}`
          );
          break;
        }
      }
      if (foundPosition === 'Not Found') {
        console.log(
          `[Server Action] Target "${targetBusinessName}" not found.`
        );
      }
    } else {
      foundPosition = 'N/A (No target specified)';
    }

    // --- Perform Revenue Calculation ---
    const categoryData = businessData[category];
    if (categoryData && parsedDollarAmount > 0) {
      const { searchVolume, avgCtrTop3 } = categoryData;
      const potentialClicks = searchVolume * avgCtrTop3;
      const potentialLeads = potentialClicks * clickToLeadRate;
      const potentialCustomers = potentialLeads * leadToCustomerRate;
      potentialMonthlyRevenue = potentialCustomers * parsedDollarAmount;

      console.log(
        `[Server Action] Calculation: SV=${searchVolume} * CTR=${avgCtrTop3} * ClicksToLeads=${clickToLeadRate} * LeadsToCustomers=${leadToCustomerRate} * AvgRev=$${parsedDollarAmount}`
      );
      console.log(
        `[Server Action] Potential Monthly Revenue: $${potentialMonthlyRevenue.toFixed(
          2
        )}`
      );

      // Construct structured calculationDetailsObject
      calculationDetailsObject = {
        inputs: {
          searchVolume: searchVolume, // Number
          avgCtrTop3: avgCtrTop3, // Rate (0-1)
          clickToLeadRate: clickToLeadRate, // Rate (0-1)
          leadToCustomerRate: leadToCustomerRate, // Rate (0-1)
          avgDollarAmount: parsedDollarAmount, // Number
          category: category, // String
        },
        derived: {
          // Values rounded as previously in display notes
          potentialClicks: Math.round(potentialClicks), // Number (integer)
          potentialLeads: Math.round(potentialLeads), // Number (integer)
          potentialCustomers: parseFloat(potentialCustomers.toFixed(1)), // Number (float, 1 decimal)
        },
        // Disclaimer text, React component can display this as is.
        disclaimer:
          "These are conservative estimates. Actual numbers vary based on specific search terms, seasonality, and your business's conversion effectiveness.",
      };
    } else {
      // Case where revenue cannot be calculated
      calculationDetailsObject = {
        error:
          'Could not calculate revenue: Invalid category data or average dollar amount provided.',
      };
      console.log('[Server Action] Revenue calculation skipped.');
    }

    // --- Prepare limited list for output ---
    const top5Listings = businessNamesExtracted.slice(0, 5);

    // --- Close Browser ---
    if (browser) {
      await browser.close();
      console.log('[Server Action] Browser closed.');
    }

    // --- Return Success ---
    return {
      success: true,
      data: {
        searchQuery,
        targetBusiness: targetBusinessName,
        category,
        avgDollarAmount: parsedDollarAmount,
        position: foundPosition, // Number or String ("Not Found", "N/A (No target specified)")
        totalListingsScraped: businessNamesExtracted.length,
        potentialMonthlyRevenue:
          potentialMonthlyRevenue !== null
            ? parseFloat(potentialMonthlyRevenue.toFixed(2))
            : null, // Number (2 decimal places) or null
        calculationDetails: calculationDetailsObject, // This is the new structured object
        listingsFound: top5Listings, // Array of strings
      },
    };
  } catch (error) {
    console.error('[Server Action] Error during scraping/calculation:', error);
    if (browser) {
      await browser.close();
      console.log('[Server Action] Browser closed after error.');
    }
    let errorMessage =
      'An unexpected error occurred during scraping or calculation.';
    if (error.message.includes('Timeout')) {
      errorMessage =
        'Scraping timed out. Google Maps might be slow or blocked.';
    } else if (error.message.includes('selector')) {
      errorMessage =
        'Could not find expected elements on the page. Selectors might need updating.';
    }
    return { success: false, error: errorMessage }; // Returns raw JSON error
  }
}
