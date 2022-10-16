import { scraperRestaurantDetail, scraperRestaurants, scraperWard } from "./scraper.js";

const scrapeController = async (browserInstance) => {
    const browser = await browserInstance;
    // const restaurants = scraperRestaurants(browser);
    const restaurantDetail = scraperRestaurantDetail(browser);
    // const wards = scraperWard(browser);
};

export default scrapeController;
