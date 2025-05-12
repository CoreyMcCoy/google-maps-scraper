'use server';

import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { businessData, clickToLeadRate, leadToCustomerRate } from '@/lib/data'; // Use alias if configured, else use relative path '../lib/data'

// Helper function for case-insensitive comparison
function namesMatchLoosely(nameFromList, targetName) {
  if (!nameFromList || !targetName) return false;
  return nameFromList
    .trim()
    .toLowerCase()
    .includes(targetName.trim().toLowerCase());
}

// --- Main Scraping and Calculation Server Action ---
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
  let calculationNotes = '';

  console.log(
    `[Server Action] Starting scrape for: "${searchQuery}", Target: "${targetBusinessName}", Category: ${category}, Avg$: ${parsedDollarAmount}`
  );

  try {
    // --- Puppeteer Launch ---
    // IMPORTANT: For deployment on serverless (Vercel Hobby), you'll likely need
    // puppeteer-core and connect to a service like Browserless.io.
    // Example using Browserless:
    // const puppeteer = require('puppeteer-core'); // Use core
    // const browserWSEndpoint = `wss://chrome.browserless.io?token=YOUR_API_KEY`;
    // browser = await puppeteer.connect({ browserWSEndpoint });

    // Standard launch (works locally, may fail on basic serverless hosting):
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // Potential args for Vercel/serverless, might need adjustment:
        // '--disable-gpu',
        // '--disable-dev-shm-usage',
        // '--single-process'
      ],
    });
    // --- End Puppeteer Launch ---

    const page = await browser.newPage();
    // Use a common user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
    );

    const googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(
      searchQuery
    )}`;

    console.log(`[Server Action] Navigating to: ${googleMapsUrl}`);
    await page.goto(googleMapsUrl, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    }); // Increased timeout

    // Auto-scroll function
    async function autoScroll() {
      await page.evaluate(async () => {
        // Using a more robust selector if 'div[role="feed"]' fails
        const scrollableContainer =
          document.querySelector('div[role="feed"]') ||
          document.querySelector(
            'div[aria-label*="Results for"] > div > div[style*="overflow"]'
          ); // Fallback selector attempt
        if (!scrollableContainer) {
          console.log('[Puppeteer] Scrollable container not found.');
          return;
        }
        let previousHeight;
        let scrollCount = 0;
        const maxScrolls = 50; // Reduced max scrolls slightly
        console.log('[Puppeteer] Starting auto-scroll...');
        for (let i = 0; i < maxScrolls; i++) {
          previousHeight = scrollableContainer.scrollHeight;
          scrollableContainer.scrollTop = scrollableContainer.scrollHeight;
          await new Promise((resolve) => setTimeout(resolve, 1000));
          if (scrollableContainer.scrollHeight === previousHeight) {
            console.log(
              `[Puppeteer] Scroll height unchanged after scroll ${i + 1}.`
            );
            break;
          }
          scrollCount++;
          console.log(`[Puppeteer] Scrolled ${scrollCount} times...`);
        }
        console.log(
          '[Puppeteer] Auto-scroll attempt finished after ' +
            scrollCount +
            ' scrolls.'
        );
      });
    }

    console.log('[Server Action] Attempting auto-scroll...');
    await autoScroll();
    console.log('[Server Action] Auto-scroll attempt completed.');
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Extra wait

    const content = await page.content();
    const $ = cheerio.load(content);

    const businessNamesExtracted = [];
    // Using YOUR CONFIRMED WORKING SELECTOR (but keep alternatives in mind)
    const businessCardSelector = 'div.Nv2PK.THOPZb'; // Your selector
    const businessCards = $(businessCardSelector);
    // Fallback example (if yours breaks): const businessCards = $('div[role="article"]');
    console.log(
      `[Server Action] Found ${businessCards.length} elements using '${businessCardSelector}'.`
    );

    businessCards.each((index, element) => {
      const businessCard = $(element);
      // Using YOUR CONFIRMED WORKING SELECTOR
      const detailsContainer = businessCard.find('.lI9IFe');
      const businessName = detailsContainer
        .find('.qBF1Pd.fontHeadlineSmall')
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
    let foundPosition = 'Not Found';
    if (targetBusinessName && targetBusinessName.trim() !== '') {
      for (let i = 0; i < businessNamesExtracted.length; i++) {
        if (namesMatchLoosely(businessNamesExtracted[i], targetBusinessName)) {
          foundPosition = i + 1;
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

      const formattedRevenue = potentialMonthlyRevenue.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      });
      let revenueContext = '';

      if (typeof foundPosition === 'number' && foundPosition <= 3) {
        revenueContext = `Your business is currently in the Top 3 (Position ${foundPosition}). The figure of <strong>${formattedRevenue}/month</strong> represents the estimated total revenue generated across the Top 3 spots based on these assumptions.`;
      } else {
        revenueContext = `Your business is currently at Position ${foundPosition}. You could be leaving about <strong>${formattedRevenue}/month</strong> on the table by not being in the Top 3.`;
      }

      calculationNotes = `
                ${revenueContext}
                <br><br>
                Here’s how we calculated it:
                <br>
                • ${searchVolume.toLocaleString()} people search for "${category}" locally each month<br>
                • ${Math.round(
                  avgCtrTop3 * 100
                )}% click the top 3 results (${Math.round(
        potentialClicks
      )} clicks)<br>
                • We estimate ${Math.round(
                  clickToLeadRate * 100
                )}% of clicks become leads (${Math.round(
        potentialLeads
      )} leads)<br>
                • And ${Math.round(
                  leadToCustomerRate * 100
                )}% of leads turn into customers (${potentialCustomers.toFixed(
        1
      )} customers)
                <br><br>
                <em>These are conservative estimates. Actual numbers vary based on specific search terms, seasonality, and your business's conversion effectiveness.</em>
            `;
    } else {
      calculationNotes =
        'Could not calculate revenue: Invalid category data or average dollar amount provided.';
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
        position: foundPosition,
        totalListingsScraped: businessNamesExtracted.length,
        potentialMonthlyRevenue: potentialMonthlyRevenue,
        calculationNotes,
        listingsFound: top5Listings,
      },
    };
  } catch (error) {
    console.error('[Server Action] Error during scraping/calculation:', error);
    if (browser) {
      await browser.close();
      console.log('[Server Action] Browser closed after error.');
    }
    // Return specific error messages if possible
    let errorMessage =
      'An unexpected error occurred during scraping or calculation.';
    if (error.message.includes('Timeout')) {
      errorMessage =
        'Scraping timed out. Google Maps might be slow or blocked.';
    } else if (error.message.includes('selector')) {
      errorMessage =
        'Could not find expected elements on the page. Selectors might need updating.';
    }
    return { success: false, error: errorMessage };
  }
}
