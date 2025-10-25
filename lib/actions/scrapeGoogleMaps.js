'use server';

import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

export async function scrapeGoogleMaps(query) {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    const googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(
      query
    )}`;

    console.log(`Navigating to: ${googleMapsUrl}`);
    await page.goto(googleMapsUrl, { waitUntil: 'networkidle2' });

    // Auto-scroll function to load more results
    async function autoScroll() {
      await page.evaluate(async () => {
        const scrollableContainer = document.querySelector('div[role="feed"]'); // Selector for scrollable container
        if (!scrollableContainer) {
          console.log(
            'Scrollable container not found. Auto-scroll might not work.'
          );
          return;
        }
        let previousHeight;
        let scrollCount = 0;
        const maxScrolls = 70;

        while (scrollCount < maxScrolls) {
          previousHeight = scrollableContainer.scrollHeight;
          scrollableContainer.scrollTop = scrollableContainer.scrollHeight;
          await new Promise((resolve) => setTimeout(resolve, 980));
          const currentHeight = scrollableContainer.scrollHeight;
          if (currentHeight === previousHeight) {
            console.log('No more content loaded. Stopping auto-scroll.');
            break; // Stop scrolling if no new content is loaded
          }
          scrollCount++;
          console.log(`Scrolled ${scrollCount}/${maxScrolls} times...`); // Log scroll count
        }
        console.log('Auto-scroll finished.');
      });
    }

    console.log('Starting auto-scroll to load more listings...');
    await autoScroll();
    console.log('Auto-scroll completed.');

    const content = await page.content();
    const $ = cheerio.load(content);

    const businessListings = [];

    const businessCards = $('div.Nv2PK.THOPZb'); // Using both classes for more specificity

    console.log(
      `Found ${businessCards.length} business card elements using 'div.Nv2PK.THOPZb'.`
    );

    businessCards.each((index, element) => {
      const businessCard = $(element);

      // New code to get GBP Link
      const gbpLink = businessCard.find('a.hfpxzc').attr('href');

      // Find the nested .lI9IFe div to get other details
      const detailsContainer = businessCard.find('.lI9IFe');

      // If the details container isn't found, skip (might be an ad or different layout)
      if (detailsContainer.length === 0) {
        console.log(
          `Card ${index}: Skipping, could not find .lI9IFe details container.`
        );
        return; // Skips to the next iteration of the loop
      }

      // Business Name (using the selector from the new HTML, inside .lI9IFe)
      const businessName = detailsContainer
        .find('.qBF1Pd.fontHeadlineSmall') // Added specific context
        .text()
        .trim();

      // Rating (using the selector from the new HTML, inside .lI9IFe)
      const ratingText = detailsContainer.find('.MW4etd').text(); // Added specific context
      const rating = parseFloat(ratingText) || null;

      // Review Count (using the selector from the new HTML, inside .lI9IFe)
      const reviewCountText = detailsContainer.find('.UY7F9').text(); // Added specific context
      const reviewCount = reviewCountText
        ? parseInt(reviewCountText.replace(/[(),.]/g, ''), 10)
        : 0;

      // Service Category (check structure inside .lI9IFe > .W4Efsd) - Re-evaluate this logic
      const serviceCategory = detailsContainer
        .find('.W4Efsd .W4Efsd span:first-child span:first')

        .text()
        .trim();

      // Address (check structure inside .lI9IFe > .W4Efsd) - Re-evaluate this logic
      let address = '';
      detailsContainer.find('.W4Efsd span').each((_, span) => {
        // Search within detailsContainer
        const text = $(span).text().trim();
        if (
          (text.match(
            /\d+.*(Ave|St|Rd|Dr|Ln|Blvd|Circle|Ct|Way|Highway|Hwy)/i
          ) ||
            text.match(/P\.?O\.?\s*Box\s*\d+/i)) &&
          !text.match(/^\(\d{3}\)/) && // Not a phone number
          !text.includes('Closes') &&
          !text.includes('Open') // Not hours
        ) {
          address = text.replace(/^[^a-zA-Z0-9]+/, '').trim(); // Clean leading symbols if any
          return false; // Stop searching once address is found
        }
      });

      // Phone Number (using selector from new HTML, inside .lI9IFe)
      const phoneNumber = detailsContainer.find('.UsdlK').text().trim(); // Added specific context

      // Website URL (using selector from new HTML, found outside .lI9IFe but inside the main card)
      const websiteUrl = businessCard.find('a.lcr4fd').attr('href');

      // Only add if we have a business name and the core GBP link
      if (businessName && gbpLink) {
        businessListings.push({
          business_name: businessName,
          service_category: serviceCategory || null, // Ensure null if not found
          phone_number: phoneNumber || null,
          address: address || null,
          website_url: websiteUrl || null,
          rating: rating,
          review_count: reviewCount,
          gbp_link: gbpLink, // Use the directly extracted link
        });
      } else {
        console.log(
          `Card ${index}: Skipping. Missing Name ('${businessName}') or GBP Link ('${gbpLink}').`
        );
        // Optional: Log card HTML for debugging skipped cards
        // console.log(businessCard.html());
      }
    });

    await browser.close();

    console.log(
      `Scraping completed. Found ${businessListings.length} valid business listings.`
    );
    // console.log(businessListings);
    return businessListings;
  } catch (error) {
    console.error('Server side error:', error);
    throw error;
  }
}
