'use server';

import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

export async function scrapeGoogleMaps(query) {
  try {
    // Removed query parameter for now, using hardcoded URL
    const browser = await puppeteer.launch({ headless: false }); // Set headless: false to see the browser in action
    const page = await browser.newPage();

    const googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`; // Dynamic URL with query

    console.log(`Navigating to: ${googleMapsUrl}`);
    await page.goto(googleMapsUrl, { waitUntil: 'networkidle2' });

    // Auto-scroll function to load more results
    async function autoScroll() {
      await page.evaluate(async () => {
        const scrollableContainer = document.querySelector('div[role="feed"]'); // Selector for scrollable container
        if (!scrollableContainer) {
          console.log('Scrollable container not found. Auto-scroll might not work.');
          return;
        }
        let previousHeight;
        let scrollCount = 0; // Counter to limit scrolling (optional)
        const maxScrolls = 100; // Maximum scrolls (adjust as needed)

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
    const businessCards = $('.lI9IFe'); // Selector for business listing cards

    console.log(`Found ${businessCards.length} business listings after scroll.`); // Log listing count after scroll

    businessCards.each((index, element) => {
      const businessCard = $(element);

      // 1. Business Name
      const businessName = businessCard.find('.qBF1Pd.fontHeadlineSmall ').text().trim();

      // 2. Rating
      const ratingText = businessCard.find('.MW4etd').text();
      const rating = parseFloat(ratingText) || null;

      // 3. Review Count
      const reviewCountText = businessCard.find('.UY7F9').text();
      const reviewCount = reviewCountText
        ? parseInt(reviewCountText.replace(/[(),.]/g, ''), 10)
        : 0;

      // 4. Service Category
      const serviceCategory = businessCard
        .find('.W4Efsd .W4Efsd span:first-child span:first')
        .text()
        .trim();

      // 5. Address - Looking for span after bullet point that contains numbers
      let address = '';
      businessCard.find('.W4Efsd .W4Efsd span').each((_, span) => {
        // businessCard.find('.W4Efsd .W4Efsd span').each((_, span) => {
        const text = $(span).text().trim();
        // Check if text includes numbers and isn't a phone number
        if (text.match(/\d/) && !text.match(/^\(\d{3}\)/)) {
          address = text;
          return false; // break the loop once we find the address
        }
      });

      // 6. Operating Hours
      const operatingStatus = businessCard
        .find('.W4Efsd span[style*="color: rgba(25,134,57,1.00)"]')
        .text()
        .trim();
      const operatingHoursText = businessCard
        .find('.W4Efsd span[style*="font-weight: 400"]:not([style*="color"])')
        .text()
        .trim();
      const operatingHours = `${operatingStatus} ${operatingHoursText}`.trim();

      // 7. Phone Number
      const phoneNumber = businessCard.find('.UsdlK').text();

      // 8. Website URL
      const websiteUrl = businessCard.find('a.lcr4fd[aria-label*="website"]').attr('href');

      if (businessName) {
        businessListings.push({
          business_name: businessName,
          rating: rating,
          review_count: reviewCount,
          service_category: serviceCategory,
          address: address,
          operating_hours: operatingHours,
          phone_number: phoneNumber,
          website_url: websiteUrl,
        });
      }
    });

    await browser.close();
    console.log(`Scraping completed. Found ${businessListings.length} business listings.`); // Log total listings found
    return businessListings; // Optionally return the data for further use
  } catch (error) {
    console.error('Server side error:', error);
    throw error;
  }
}
