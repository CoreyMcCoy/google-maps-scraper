'use server';

import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

export async function scrapeGoogleMaps(query) {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );

    const googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;

    console.log(`Navigating to: ${googleMapsUrl}`);
    await page.goto(googleMapsUrl, { waitUntil: 'networkidle2' });

    async function autoScroll() {
      await page.evaluate(async () => {
        const scrollableContainer = document.querySelector('div[role="feed"]');
        if (!scrollableContainer) return;

        let previousHeight;
        let scrollCount = 0;
        const maxScrolls = 70;

        while (scrollCount < maxScrolls) {
          previousHeight = scrollableContainer.scrollHeight;
          scrollableContainer.scrollTop = scrollableContainer.scrollHeight;
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const currentHeight = scrollableContainer.scrollHeight;
          if (currentHeight === previousHeight) break;
          scrollCount++;
        }
      });
    }

    console.log('Starting auto-scroll...');
    await autoScroll();

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const content = await page.content();
    const $ = cheerio.load(content);
    const businessListings = [];
    const businessCards = $('div.Nv2PK.THOPZb');

    console.log(`Found ${businessCards.length} business card elements.`);

    businessCards.each((index, element) => {
      const businessCard = $(element);
      const detailsContainer = businessCard.find('.lI9IFe');

      if (detailsContainer.length === 0) return;

      const businessName = detailsContainer.find('.qBF1Pd').text().trim();

      // --- RATING & REVIEWS ---
      const ratingSection = detailsContainer.find('.AJB7ye');
      const ratingText = ratingSection.find('.MW4etd').text().trim();
      let rating = parseFloat(ratingText);
      if (isNaN(rating)) {
        const ariaLabel = ratingSection.find('.ZkP5Je').attr('aria-label') || '';
        rating = parseFloat(ariaLabel.split(' ')[0]) || 0;
      }

      let reviewCount = 0;
      const visualReviewText = ratingSection.find('.UY7F9').text().trim();

      if (visualReviewText) {
        reviewCount = parseInt(visualReviewText.replace(/\D/g, ''), 10);
      } else {
        const ariaLabel = ratingSection.find('.ZkP5Je').attr('aria-label') || '';
        const match = ariaLabel.match(/(\d+)\s+Reviews/i);
        if (match) reviewCount = parseInt(match[1], 10);
      }

      // --- CATEGORY LOGIC (UPDATED) ---
      let serviceCategory = null;

      detailsContainer.find('.W4Efsd').each((_, block) => {
        const text = $(block).text().trim();

        if (!text) return;

        // Skip standard junk
        if (text.startsWith(rating.toString()) || text.includes('stars')) return;
        if (/^\d\.\d/.test(text)) return;
        if (text.includes('Open') || text.includes('Closes') || text.includes('24 hours')) return;
        if (/\(\d{3}\)/.test(text)) return;
        if (text === 'Website' || text === 'Directions') return;

        // *** THE FIX: Explicitly ignore "No reviews" ***
        if (text === 'No reviews') return;

        // Capture Category
        if (text.includes('·')) {
          // "Waste management service · 900 N 65th St"
          serviceCategory = text.split('·')[0].trim();
        } else {
          // "Junk removal service"
          serviceCategory = text;
        }

        if (serviceCategory) return false;
      });

      const phoneNumber = detailsContainer.find('.UsdlK').text().trim() || null;
      const gbpLink = businessCard.find('a.hfpxzc').attr('href');
      const websiteUrl = businessCard.find('a.lcr4fd').attr('href') || null;

      if (businessName && gbpLink) {
        businessListings.push({
          business_name: businessName,
          service_category: serviceCategory,
          phone_number: phoneNumber,
          website_url: websiteUrl,
          rating: rating,
          review_count: reviewCount,
          gbp_link: gbpLink,
        });
      }
    });

    await browser.close();
    return businessListings;
  } catch (error) {
    console.error('Server side error:', error);
    throw error;
  }
}
