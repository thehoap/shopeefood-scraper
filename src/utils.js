export const autoScroll = async (page) => {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
};

export const getWardOrDistrict = (address, flagText) => {
    const startIndex = address.indexOf(flagText);
    if (startIndex === -1) return '';
    const endIndex = address.indexOf(',', startIndex);
    return address.substring(startIndex + flagText.length, endIndex);
};
