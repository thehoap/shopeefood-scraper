import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { districts, wards } from "./constants.js";
import { autoScroll, getWardOrDistrict } from "./utils.js";
// export const scraperRestaurants = async (browser) => {
//     for (let i = 0; i < districts.length; i++) {
//         for (let j = 0; j < categories.length; j++) {
//             const page = await browser.newPage();
//             const url = `https://shopeefood.vn/da-nang/food/danh-sach-dia-diem-phuc-vu-${categories[j]}-tai-khu-vuc-${districts[i]}-giao-tan-noi`;
//             await page.goto(url, {
//                 waitUntil: "networkidle0",
//             });
//             await page.setViewport({
//                 width: 1500,
//                 height: 800,
//             });

//             await page.waitForSelector("#app");
//             await autoScroll(page);

//             console.log("Load done");

//             const restaurants = await page.$$eval(
//                 ".container .now-list-restaurant .list-restaurant .item-restaurant",
//                 (els) => {
//                     return els.map((el) => ({
//                         image: el
//                             .querySelector(".img-restaurant img")
//                             .getAttribute("src"),
//                         name: el.querySelector(".info-restaurant .name-res")
//                             ?.innerText,
//                         address: el.querySelector(
//                             ".info-restaurant .address-res"
//                         )?.innerText,
//                         type:
//                             el.querySelector(".kind-restaurant")?.innerText ||
//                             "",
//                     }));
//                 }
//             );
//             console.log(restaurants);
//             await page.close();
//         }
//     }
//     await browser.close();
// };
export const scraperRestaurants = async (browser) => {
    let restaurants = [];

    const page = await browser.newPage();
    const url = `https://shopeefood.vn/da-nang/danh-sach-dia-diem-giao-tan-noi`;
    await page.goto(url, {
        waitUntil: "networkidle0",
    });

    await page.setViewport({
        width: 1500,
        height: 800,
    });

    await page.waitForSelector("#app");
    console.log("Load done");

    const totalPages = await page.$$eval(".pagination", (els) => {
        return +els[0].querySelector("li:nth-last-child(2) a").innerText;
    });

    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
        await autoScroll(page);

        let restaurantsPerPage = await scraperRestaurantPerPage(page);
        restaurants = restaurants.concat(restaurantsPerPage);

        if (currentPage != totalPages) {
            await page.click(".pagination li:last-child a");
        }
    }
    const restaurantsJson = JSON.stringify(restaurants);
    fs.writeFile("db/restaurants.json", restaurantsJson, "utf8", (err) => {
        if (err) throw err;
        console.log("Complete Restaurants");
    });

    await browser.close();
};

export const scraperRestaurantDetail = async (browser) => {
    const page = await browser.newPage();
    await page.exposeFunction("readfile", async (filePath) => {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, "utf8", async (err, text) => {
                if (err) {
                    reject(err);
                } else {
                    const menus = [];
                    const updatedRestaurants = [];

                    let restaurants = JSON.parse(text);
                    for (let restaurant of restaurants) {
                        const page = await browser.newPage();
                        const url = restaurant.link;
                        await page.goto(url, {
                            waitUntil: "networkidle0",
                        });
                        await page.setViewport({
                            width: 1500,
                            height: 800,
                        });

                        try {
                            await page.waitForSelector("#FoodyApp");
                            const restaurantMenu = await scraperRestaurantMenu(
                                page
                            );
                            const restaurantInfo = await scraperRestaurantInfo(
                                page
                            );

                            const menuId = uuidv4();
                            menus.push({
                                id: menuId,
                                items: restaurantMenu,
                            });
                            const menuJson = JSON.stringify(menus);
                            fs.writeFile(
                                "db/menus.json",
                                menuJson,
                                "utf8",
                                (err) => {
                                    if (err) throw err;
                                    console.log("Complete Menu");
                                }
                            );

                            updatedRestaurants.push({
                                ...restaurant,
                                menuId,
                                time: restaurantInfo.time,
                                priceRange: restaurantInfo.priceRange,
                            });
                            const restaurantsJson =
                                JSON.stringify(updatedRestaurants);
                            fs.writeFile(
                                filePath,
                                restaurantsJson,
                                "utf8",
                                (err) => {
                                    if (err) throw err;
                                    console.log(
                                        "Complete Restaurants with Menu Time Price range"
                                    );
                                }
                            );
                        } catch (err) {
                            console.log(err);
                        }
                        await page.close();
                    }
                }
            });
        });
    });

    await page.evaluate(async () => {
        await window.readfile("db/restaurants.json");
        await browser.close();
    });
};

export const scraperWard = async (browser) => {
    const page = await browser.newPage();
    const url = `https://diaocthinhvuong.vn/danh-sach-don-vi-hanh-chinh-thanh-pho-da-nang/"
    )}`;
    await page.goto(url, {
        waitUntil: "networkidle0",
    });

    await page.setViewport({
        width: 1500,
        height: 800,
    });

    let wards = [];
    await page.waitForSelector("#myhome-app");

    wards = await page.$$eval("#footable_17355 tbody tr", (els) => {
        return els.map((el, index) => ({
            id: el.querySelector(".ninja_column_4")?.innerText,
            name: el.querySelector(".ninja_column_3")?.innerText,
            districtId: el.querySelector(".ninja_column_2")?.innerText,
        }));
    });
    console.log(wards);
    await browser.close();
};

const scraperRestaurantPerPage = async (page) => {
    let restaurantsPerPage = await page.$$eval(
        ".container .now-list-restaurant .list-restaurant .item-restaurant",
        (els) =>
            els.map((el) => ({
                link:
                    "https://www.foody.vn" +
                    el.querySelector("a.item-content").getAttribute("href"),
                image: el
                    .querySelector(".img-restaurant img")
                    .getAttribute("src"),
                name: el.querySelector(".info-restaurant .name-res")?.innerText,
                type: el.querySelector(".kind-restaurant")?.innerText || "",
                address: el.querySelector(".info-restaurant .address-res")
                    ?.innerText,
            }))
    );

    restaurantsPerPage = restaurantsPerPage.map((restaurant) => {
        const HVDistrict = {
            id: 497,
            label: "Hòa Vang",
            value: "hoa-vang",
        };
        const district =
            restaurant.address.indexOf(HVDistrict.label) !== -1
                ? HVDistrict
                : districts.find(
                      (district) =>
                          district.label ===
                          "Quận " +
                              getWardOrDistrict(restaurant.address, "Quận ")
                  );
        const ward = wards.find(
            (ward) =>
                ward.label ===
                    "Phường " + getWardOrDistrict(restaurant.address, "P. ") ||
                ward.label ===
                    "Xã " + getWardOrDistrict(restaurant.address, "X. ") ||
                ward.label ===
                    "Xã " + getWardOrDistrict(restaurant.address, "Xã ")
        );

        return {
            ...restaurant,
            id: uuidv4(),
            districtId: district?.id || -1,
            wardId: ward?.id || -1,
        };
    });

    return restaurantsPerPage;
};

const scraperRestaurantMenu = async (page) => {
    const menu = await page.$$eval(
        ".microsite-table-book .tb-offers-box .delivery-dishes-item.ng-scope",
        (els) =>
            els.map((el, index) => ({
                id: index,
                image: el
                    .querySelector(".delivery-dishes-item-left .img-box")
                    .getAttribute("src"),
                name: el.querySelector(
                    ".delivery-dishes-item-right .title-name"
                )?.innerText,
                currentPrice:
                    el.querySelector(
                        ".delivery-dishes-item-right .rating-food .price-discount .ng-binding"
                    )?.innerText || "",
                originalPrice: el.querySelector(
                    ".delivery-dishes-item-right .rating-food .price.ng-binding"
                )?.innerText,
            }))
    );
    return menu.map((item) => ({ ...item, id: uuidv4() }));
};

const scraperRestaurantInfo = async (page) => {
    return await page.$$eval(
        ".micro-header .main-information .res-common-price",
        (els) => ({
            time: els[0]
                .querySelector(".micro-timesopen span:nth-child(3)")
                ?.innerText.replace(/\u00A0/, ""),
            priceRange: els[0].querySelector(
                ".res-common-minmaxprice span:last-child > span"
            )?.innerText,
        })
    );
};
