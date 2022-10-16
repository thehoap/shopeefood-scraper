import puppeteer from "puppeteer";

const startBrowser = async () => {
    const browser = await puppeteer.launch({
        headless: false,
    });

    return browser;
};

export default startBrowser;
