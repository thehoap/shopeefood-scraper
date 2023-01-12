import startBrowser from './browser.js';
import scrapeController from './scrapeController.js';

const browser = startBrowser();
scrapeController(browser);
