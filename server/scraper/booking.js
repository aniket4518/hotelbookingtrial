const puppeteer = require("puppeteer");

async function scrapeBooking({ userId, UserModel }) {
  // Fetch user's last LLM response from the database
  const user = await UserModel.findById(userId);
  if (!user || !user.llmResponse) {
    throw new Error("User LLM response not found in database.");
  }
  const { location, checkIn, checkOut, maxPrice = 10000 } = user.llmResponse;
  if (!location || !checkIn || !checkOut) {
    throw new Error("Missing location, checkIn, or checkOut in user LLM response.");
  }

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  const url = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
    location
  )}&checkin_year=${checkInDate.getFullYear()}&checkin_month=${
    checkInDate.getMonth() + 1
  }&checkin_monthday=${checkInDate.getDate()}&checkout_year=${checkOutDate.getFullYear()}&checkout_month=${
    checkOutDate.getMonth() + 1
  }&checkout_monthday=${checkOutDate.getDate()}&nflt=price%3D1%2C2&selected_currency=INR`;

  await page.goto(url, { waitUntil: "networkidle2" });

  // Debug: Save a screenshot to see what the page looks like
  await page.screenshot({ path: 'booking_debug.png', fullPage: true });
  console.log('Scraper navigated to:', url);

  let hotels = [];
  try {
    // Try to find hotel cards by a more generic selector (e.g., hotel name input box means no results)
    await page.waitForSelector('[data-testid="property-card"]', { timeout:45000 });
    hotels = await page.$$eval('[data-testid="property-card"]', (cards) => {
      return cards.map((card) => {
        const name = card.querySelector('[data-testid="title"]')?.innerText.trim();
        const link = card.querySelector("a")?.href;
        const priceText = card.querySelector('[data-testid="price-and-discounted-price"]')?.innerText;
        const priceMatch = priceText?.match(/₹\s?([\d,]+)/);
        const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, "")) : null;
        return { name, price, link };
      });
      
    });
        console.log("Hotels found:", hotels);

  } catch (err) {
    // If property cards are not found, check if the search form is present (means no results page)
    const searchBoxExists = await page.$('input[name="ss"]');
    if (searchBoxExists) {
      console.error("Booking.com search page loaded instead of results. Likely invalid or missing search parameters.");
      await browser.close();
      // Return a clear message for the server to send to the user
      return [{
        name: "No hotels found",
        price: null,
        link: null,
        note: "Booking.com search page loaded instead of results. Please check your location, check-in, and check-out dates."
      }];
    }
    // Try another fallback: look for hotel names by class (inspect booking_debug.png for actual class)
    hotels = await page.$$eval('.fcab3ed991', (titles) => {
      return titles.map((el) => ({
        name: el.innerText.trim(),
        price: null,
        link: null
      }));
    });
    if (!hotels.length) {
      console.error("Fallback selector also failed. Check booking_debug.png for page structure.");
    }
  }

  await browser.close();

  // Filter by maxPrice if needed
  const filtered = hotels.filter((h) => h.price && h.price <= maxPrice);

  // If fallback hotels have no price, just return the first 10
  return filtered.length ? filtered.slice(0, 10) : hotels.slice(0, 10);
}

module.exports = scrapeBooking;
