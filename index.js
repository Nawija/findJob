const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const nodemailer = require("nodemailer");
const CronJob = require("cron").CronJob;

let browser;
const today = new Date();
const dateToday = today.getDate();
const dateYesterday = today.getDate() - 1;
const dateTime = " godz.";
let sesion = 0;

let articles = [];
let checkArticles = [];
let todayOfferts = [];
let yesterDayOfferts = [];

const urlOlxGlobal =
    "https://www.olx.pl/siedlce/q-praca/?search%5Border%5D=created_at%3Adesc";
const urlOlxFilter =
    "https://www.olx.pl/siedlce/q-praca/?search%5Border%5D=created_at%3Adesc";
const urlPracujPLFilter = "https://www.pracuj.pl/praca/siedlce;wp?rd=0&sc=0";
const urlPracaPLFilter = "https://www.praca.pl/siedlce.html";

const imgOlx =
    "https://play-lh.googleusercontent.com/IZbR5N9NRi4JZmiBkGsp7pUQikm8cQMZtnC2RN1e7xhU3u3-cObSYUSquVoqgeuRQw=w480-h960-rw";
const imgPracujPL =
    "https://scontent.fwaw3-2.fna.fbcdn.net/v/t39.30808-6/348427004_502261792019418_2084104610822280835_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=5f2048&_nc_ohc=YP33eeHZnTsAX_4VSQY&_nc_ht=scontent.fwaw3-2.fna&oh=00_AfCGjrXMDj9W9VvJmzRsBJxE2G1uTvJmR-gwI7L2-o8LAw&oe=6601E4CE";
const imgPracaPL =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAMAAACahl6sAAAArlBMVEX///8dHRv///1jY2MqKijx8fG4uLZxcXGqqqoBX6dxcW8AX6m4uLgdHR1jY2FHR0WcnJx/f30vLy3X19c3NzXHx8f4+Pg6OjilpaV6enqVlZXAwMCEhIJAQD7n5+dXV1ckJCROTk6NjYvFxcPd3d1bW1vr6+lzc3NLS0vS0tJpaWkgHBnT4/CbvdiGttqoyOHr9PlAh797rNQRbLNQksLE2+0ieLXS4u9mn8wccbKT2gtxAAAFQUlEQVR4nO2ZC3eiOhRGI4KiRUGk+KrP2ofe6bTTmWnn/v8/dsk5gQRR2zUD6qz77XnICjHJTk5CgkIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPy91Ihzt6IEIHJpQOTSgMilAZFLAyImPYkrhNeNQn/lcGLQTBiJeOwvXE7p39wNQjtajibmlzc3j5Ed+aNrI+0+6E5DO5xuh06xtj5V109KXobh3C1ThMpoW1subDCjxLq8timRKruv1zKm/fSrTjdLnM/SxJXOaQ8LtXkyveOtp5yjG5cmYrHITVr5klKphXajpkScac3AXisP30icqu4fmTlrwV6RWiMrb1yyyFzXfZuJLKapSC/XOiUrtrnEG0q7zudczHaq83aqs+NyRZIS5xFfjDIRRorYdOUHbrMjLzo0JH0l4N7RZ0TFPXBhK3dlGz2+K5KE8B3fr03KElGFRDMRP+ru1lOi46ZNtp3sBsX+KvWOB3RFnc8x4yVXLvf9Tm0NLrUei/WCrlYliwRZ1ZEp0vY2SfMnuk0Bj4K85PiQ6xXPC1oDuJ+l8swYp4KIHFKOzF7JIrIVquMNkVvOwvFQF5lsU17qcRjT1SbfJEeXVhAhPf5Wu2QROedmuyJbcUxEd35wWGS3dSxC4TusRERXbYikj4GJLWkeFHF9Ca0AlNP+SKSrizqJSKOYe68IYe18/rUiu1ysyHriBsG4/gkR59pLsq4uUyQIawbHRDZLM6dqnWVRzFmJiHykGuvGiUXyO6hjIpNFPqueNIRHW4OziQzzjTsisrZ3slKqJaELDq1zicQqrmzfjz4QeVDtH/i+LthSNsl/jX/OGVq3nKcXC+ujVUttL9f5VUsvzYVn60lFeDMx0LUfFFlzaRuxZ/mVk/3MocVTvfcJET6ORLo0NdkprOQ/Z3lOEd6nDj8hwpFzlxMhjS9PX59f5JjQYbM6kc5RET5meQdF1g2Jk2+cFrGsL99ardZV61WOSr9W3H+eSoSPgJODInr3y7dHOZFkOL4nGlfJ3x8yvNpVihwPLX2EOibSz67yIkJ8kxJXUuYpGZ7bnMhDBSKF80he5HBo6REJ9G0t8jOJqkRDRtdbMiSxEhlWNiLrQyLGHDFq1yLjbETYc5sX+UphxTYvQh4taTUYVyIiT0W85AyKIsaqNdK1T7Mv9rIRMVat66x1r2lgJSrv9MWpzNCm+2Wf2WVYcwTNiyI3WT+rrVQzr8e7kVnW+jDOSuMRobkuB+RKjkhIC8e98b6oRJFad8xrE3dRXkTtGVfeWG26jFOvPfbqOiRVPG09N30HlyS+SwcalNabxVNx0VvxuwteQsoUyaB3CMasSJh1srvc+fSgiHPvUbkDhPEWdZC17kdLzZGrZ5HODUVktMHabdrviGSnCFpQdkRE9oozmmkRsTG37AN+xOtWulQGPaBe3lRovSZtjSOjNvV+o0SRjc+9vnT2ifS5yZ3BWhgioq/7P30bHy9VQsDh2ZEPROvll5wg/z7J56FcGbrD0BzGMkWSo91o7nddfs2vGpGJiNloaofLINY/pzCTh8fQDs3fR5zVdFGLmn35G0u73Wyq5Pjn8zttG2m+dYXjbpfLZvq1tA2liFSGJf9Y6lByq8/sVj7TH3MCEZaRNpZxsCqbUuLzA/i8Lj+Mlw9lcwqRNHIs0ah6RKooeR8Q+ZhziHSrKBoiv0Xly28VJe+jSpGOpIqS9yFFOp1KRCp+ghSqO3F9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPg/8B/L/URbIJ42wwAAAABJRU5ErkJggg==";

async function initializeBrowser() {
    if (!browser) {
        browser = await puppeteer.launch({ headless: true }).catch((error) => {
            console.error("Błąd podczas uruchamiania przeglądarki:", error);
            throw error;
        });
    }
}
async function checkJobOlxGlobal(page, browser) {
    if (!browser) {
        browser = await puppeteer.launch({ headless: true }).catch((error) => {
            console.error("Błąd podczas uruchamiania przeglądarki:", error);
            throw error;
        });
    }
    img = imgOlx;
    try {
        // const browser = await puppeteer.launch({ headless: true });
        // const page = await browser.newPage();
        await page.goto(urlOlxGlobal, {
            waitUntil: "networkidle2",
            timeout: 60000,
        });
        const cookies = await page.$(
            'button[id="onetrust-accept-btn-handler"]'
        );
        if (cookies) {
            await cookies.click();
        }

        let html = await page.evaluate(() => document.body.innerHTML);
        const $ = cheerio.load(html);
        $(".jobs-ad-card", html).each(function () {
            const title = $(this).find("h6").text();
            let url = $(this).find("a").attr("href");
            let link = `https://www.olx.pl/${url}`;
            const pln = $(this).find(".css-1jnbm5x").text();
            const date = $(this).find(".css-l3c9zc").text();

            const articleExists = articles.some(
                (article) =>
                    article.title === title &&
                    article.link === link &&
                    article.pln === pln &&
                    article.date === date &&
                    article.img === img
            );
            if (!articleExists) {
                articles.push({
                    title,
                    link,
                    pln,
                    date,
                    img,
                });
            }
        });
    } catch (error) {
        console.log(error);
    }
}
async function checkJobOlxFilter(page, browser) {
    if (!browser) {
        browser = await puppeteer.launch({ headless: true }).catch((error) => {
            console.error("Błąd podczas uruchamiania przeglądarki:", error);
            throw error;
        });
    }
    img = imgOlx;
    try {
        // const browser = await puppeteer.launch({ headless: true });
        // const page = await browser.newPage();
        await page.goto(urlOlxFilter, {
            waitUntil: "networkidle2",
            timeout: 60000,
        });
        const cookies = await page.$(
            'button[id="onetrust-accept-btn-handler"]'
        );
        if (cookies) {
            await cookies.click();
        }

        let html = await page.evaluate(() => document.body.innerHTML);
        const $ = cheerio.load(html);
        $(".jobs-ad-card", html).each(function () {
            const title = $(this).find("h6").text();
            let url = $(this).find("a").attr("href");
            let link = `https://www.olx.pl/${url}`;
            const pln = $(this).find(".css-1jnbm5x").text();
            const date = $(this).find(".css-l3c9zc").text();

            const articleExists = articles.some(
                (article) =>
                    article.title === title &&
                    article.link === link &&
                    article.pln === pln &&
                    article.date === date &&
                    article.img === img
            );
            if (!articleExists) {
                articles.push({
                    title,
                    link,
                    pln,
                    date,
                    img,
                });
            }
        });
    } catch (error) {
        console.log(error);
    }
}
async function checkJobPracujPLFilter(page, browser) {
    if (!browser) {
        browser = await puppeteer.launch({ headless: true }).catch((error) => {
            console.error("Błąd podczas uruchamiania przeglądarki:", error);
            throw error;
        });
    }
    img = imgPracujPL;
    try {
        // const browser = await puppeteer.launch({ headless: true });
        // const page = await browser.newPage();
        await page.goto(urlPracujPLFilter, {
            waitUntil: "networkidle2",
            timeout: 60000,
        });

        let html = await page.evaluate(() => document.body.innerHTML);
        const $ = cheerio.load(html);
        $(".tiles_c1m5bwec", html).each(function () {
            const title = $(this).find("h2").text();
            let url = $(this).find("a").attr("href");
            let link = `${url}`;
            const pln = $(this).find(".tiles_s1nj37zv").text();
            const date = $(this).find(".tiles_b10050bf").text();

            const articleExists = articles.some(
                (article) =>
                    article.title === title &&
                    article.link === link &&
                    article.pln === pln &&
                    article.date === date &&
                    article.img === img
            );
            if (!articleExists) {
                articles.push({
                    title,
                    link,
                    pln,
                    date,
                    img,
                });
            }
        });
    } catch (error) {
        console.log(error);
    }
}
async function checkJobPracaPLFilter(page, browser) {
    if (!browser) {
        browser = await puppeteer.launch({ headless: true }).catch((error) => {
            console.error("Błąd podczas uruchamiania przeglądarki:", error);
            throw error;
        });
    }
    img = imgPracaPL;
    try {
        // const browser = await puppeteer.launch({ headless: true });
        // const page = await browser.newPage();
        await page.goto(urlPracaPLFilter, {
            waitUntil: "networkidle2",
            timeout: 60000,
        });

        let html = await page.evaluate(() => document.body.innerHTML);
        const $ = cheerio.load(html);
        $(".listing__item", html).each(function () {
            const title = $(this).find("h3").text();
            let url = $(this).find("a").attr("href");
            let link = `${url}`;
            const pln = $(this).find(".listing__main-details > span").text();
            const date = $(this)
                .find(".listing__secondary-details > span")
                .text();

            const articleExists = articles.some(
                (article) =>
                    article.title === title &&
                    article.link === link &&
                    article.pln === pln &&
                    article.date === date &&
                    article.img === img
            );
            if (!articleExists) {
                articles.push({
                    title,
                    link,
                    pln,
                    date,
                    img,
                });
            }
        });
    } catch (error) {
        console.log(error);
    }
}

async function filterArticles() {
    articles = articles.filter(
        (value, index, self) =>
            index ===
            self.findIndex(
                (t) => t.title === value.title && t.date === value.date
            )
    );

    if (articles.length !== checkArticles.length) {
        const todayRegExp = new RegExp(`Dzisiaj|${dateTime}|${dateToday}\\s`);
        const yesterdayRegExp = new RegExp(`${dateYesterday}\\s`);

        todayOfferts = articles.filter(({ date }) => todayRegExp.test(date));
        yesterDayOfferts = articles.filter(({ date }) =>
            yesterdayRegExp.test(date)
        );

        checkArticles = articles;

        if (todayOfferts.length > 0) {
            sendMail();
        }
    }
    console.log(`articles: `, articles.length);
    console.log(`todayOfferts: `, todayOfferts.length);
    console.log(`yesterDayOfferts: `, yesterDayOfferts.length);
}

async function sendMail() {
    const todayHTML = generateOfferHTML(todayOfferts);
    const yesterdayHTML = generateOfferHTML(yesterDayOfferts);

    let transporter = nodemailer.createTransport({
        service: `gmail`,
        auth: {
            user: "infokwbot@gmail.com",
            pass: "cqkwmnwiugujvkou",
        },
    });

    try {
        let info = await transporter.sendMail({
            from: '"KW" <infokwbot@gmail.com>',
            to: "konradwiel@interia.pl",
            subject: `Znaleziono (${todayOfferts.length}) oferty`,
            html: generateEmailHTML(todayHTML, yesterdayHTML),
        });

        console.log(`Message Sent to KW`, info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

function generateOfferHTML(offers) {
    return offers
        .map(
            (offer) => `
            <div style="max-width: 900px; margin: 0 auto;">
            <div style="display: flex; align-items: start; justify-content: space-between; padding: 45px 4px">
                <div style="text-align: start; font-size: 102%; width: 58%;">
                    <p style="font-size: 18px;font-weight: 600; margin: 0">${offer.title}</p>
                    <p style="font-size: 14px;">${offer.date}</p>
                </div>
                <div
                    style="display: flex; flex-direction: column; text-align: center; align-items: center; justify-content: center; width: 33%;">
                    <button
                    style="padding: 6px 13px; background-color: #355ab8; font-size: 15px; border: none; outline: none; border-radius: 7px; cursor: pointer;">
                    <a style="color: inherit; color: white; text-decoration: none; display: flex; align-items: center;"
                    href="${offer.link}">
                    <img style="height: 16px; width: 16px; margin-right: 5px; border-radius: 50%;"
                    src="${offer.img}" /> Szczegóły
                    </a>
                    </button>
                    <p style="font-size: 13px; font-weight: 600; width: 65%; letter-spacing: -1px;">${offer.pln}</p>
                </div>
            </div>
            <div style="height: 1.7px;width: 100%; background-color: #dcdcdc;"></div>
        </div>
    `
        )
        .join("");
}

function generateEmailHTML(todayHTML, yesterdayHTML) {
    return `
    <style>
        /* CSS styles */
    </style>
    <body style="margin: 0; padding: 0; box-sizing: border-box; text-align: center;">
        <h2 style="text-transform: uppercase; font-size: 18px; margin: 40px 0; background-color: #355ab8; color: #ffffff; border-radius: 7px; padding: 12px;">Dzisiejsze Oferty:</h2>
        ${todayHTML}
        <h2 style="text-transform: uppercase; font-size: 18px; margin: 40px 0; background-color: #355ab8; color: #ffffff; border-radius: 7px; padding: 12px;">Wczorajsze Oferty:</h2>
        ${yesterdayHTML}
    </body>
    `;
}

async function startSection() {
    await initializeBrowser();
    console.log(`Sesja rozpoczeta...`);
    const page = await browser.newPage();
    try {
        console.log(`zaczynam checkJobOlxGlobal`);
        await checkJobOlxGlobal(page);
        console.log(`zaczynam checkJobOlxFilter`);
        await checkJobOlxFilter(page);
        console.log(`zaczynam checkJobPracujPLFilter`);
        await checkJobPracujPLFilter(page);
        console.log(`zaczynam checkJobPracaPLFilter`);
        await checkJobPracaPLFilter(page);
        console.log(`Sesja udana`);
    } catch (error) {
        console.error("Błąd podczas sesji:", error);
    } finally {
        await page.close();
        console.log(`zamykam stronę`);
    }
}

async function startScraping() {
    console.log(`Zbieram dane ...`);
    if (sesion <= 1) {
        sesion++;
        await initializeBrowser();
        await startSection();
        console.log(`Filtrowanie danych`);
        await filterArticles();
    }

    const job = new CronJob(
        "* */1 * * * *",
        async function () {
            await initializeBrowser();
            await startSection();
            console.log(`Filtrowanie danych`);
            await filterArticles();
        },
        null,
        true,
        "America/Los_Angeles"
    );

    job.start();
}

startScraping();

// let loadingProgress = 0;
// const totalIterations = 4;
// while (scrapingData <= totalIterations) {
//     await checkJobOlx();
//     loadingProgress = Math.round((scrapingData / totalIterations) * 100);
//     const progressBar = "=".repeat(loadingProgress / 2);
//     console.log(
//         `Zebranych ofert: `,
//         articles.length,
//         `[${progressBar}] ${loadingProgress}%`
//     );
//     scrapingData++;
// }
