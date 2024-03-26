const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const nodemailer = require("nodemailer");
const CronJob = require("cron").CronJob;

const headless = true;
mailToSend = "konradwiel@interia.pl";
let titleMessage = "Dzisiejsze oferty ";
let firstTime = true;

const today = new Date();
const dateToday = today.getDate();
const dateTime = " godz.";
let scrapingData = 0;

let articles = [];
let todayOfferts = [];

const urlOlxGlobal =
    "https://www.olx.pl/siedlce/q-praca/?search%5Border%5D=created_at%3Adesc";
const urlOlxFilter =
    "https://www.olx.pl/siedlce/q-praca/?search%5Border%5D=created_at%3Adesc";
const urlPracaPLFilter = "https://www.praca.pl/siedlce.html";

const imgOlx =
    "https://play-lh.googleusercontent.com/IZbR5N9NRi4JZmiBkGsp7pUQikm8cQMZtnC2RN1e7xhU3u3-cObSYUSquVoqgeuRQw=w480-h960-rw";
const imgPracaPL =
    "https://scontent.fwaw3-2.fna.fbcdn.net/v/t39.30808-1/402657097_738761554952698_875600304760542286_n.jpg?stp=dst-jpg_p480x480&_nc_cat=111&ccb=1-7&_nc_sid=5f2048&_nc_ohc=_9_6s5fhwA0AX-RVCw_&_nc_ht=scontent.fwaw3-2.fna&oh=00_AfCimYUv_F3bE6tvgzaxd3Nfr0ZqQh7x2vGq0vdbRJknUg&oe=6603B6AE";

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkJobOlxGlobal() {
    const browser = await puppeteer.launch({ headless: headless });
    const page = await browser.newPage();
    img = imgOlx;
    try {
        await page.goto(urlOlxGlobal, {
            waitUntil: "networkidle2",
            timeout: 440000,
        });
        await sleep(2000);
        // const cookies = await page.$(
        //     'button[id="onetrust-accept-btn-handler"]'
        // );
        // if (cookies) {
        //     await cookies.click();
        // }
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
        await browser.close();
    } catch (error) {
        console.log(error);
    }
}
async function checkJobOlxFilter() {
    const browser = await puppeteer.launch({ headless: headless });
    const page = await browser.newPage();
    img = imgOlx;
    try {
        await page.goto(urlOlxFilter, {
            waitUntil: "networkidle2",
            timeout: 440000,
        });
        await sleep(2000);
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
        await browser.close();
    } catch (error) {
        console.log(error);
    }
}
async function checkJobPracaPLFilter() {
    const browser = await puppeteer.launch({ headless: headless });
    const page = await browser.newPage();
    img = imgPracaPL;
    try {
        await page.goto(urlPracaPLFilter, {
            waitUntil: "networkidle2",
            timeout: 440000,
        });
        await sleep(2000);
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
        await browser.close();
    } catch (error) {
        console.log(error);
    }
}

function parseDateFromString(dateString) {
    if (dateString.includes("godz.")) {
        const hours = parseInt(dateString.match(/\d+/)[0]);
        return new Date(Date.now() - hours * 60 * 60 * 1000);
    } else if (dateString.includes("Dzisiaj")) {
        return new Date();
    } else {
        return new Date(dateString);
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

    const todayRegExp = new RegExp(`Dzisiaj|${dateTime}|${dateToday}\\s`);

    // Kopia dzisiejszych ofert przed aktualizacją listy
    const previousTodayOffers = [...todayOfferts];

    todayOfferts = articles.filter(({ date }) => todayRegExp.test(date));

    // Sprawdzanie, czy są nowe oferty
    const newOffers = todayOfferts.filter(
        (offer) =>
            !previousTodayOffers.some(
                (prevOffer) =>
                    prevOffer.title === offer.title &&
                    prevOffer.date === offer.date
            )
    );

    if (newOffers.length > 0) {
        if (firstTime === true) {
            titleMessage = "Dzisiejsze oferty ";
            firstTime = false;
        } else if (newOffers.length === 1) {
            titleMessage = "Nowa oferta ";
        } else {
            titleMessage = "Nowe oferty ";
        }
        newOffers.sort(
            (a, b) => parseDateFromString(b.date) - parseDateFromString(a.date)
        );
        sendMail(newOffers);
    }

    console.log(`Oferty: `, articles.length);
    console.log(`Nowe oferty `, newOffers.length);
}

async function sendMail(newOffers) {
    const todayHTML = generateOfferHTML(newOffers);

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
            to: `${mailToSend}`,
            subject: `${titleMessage} (${newOffers.length})`,
            html: generateEmailHTML(todayHTML),
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

function generateEmailHTML(todayHTML) {
    return `
    <body style="margin: 0; padding: 0; box-sizing: border-box; text-align: center;">
        <h2 style="text-transform: uppercase; font-size: 18px; margin: 40px 0; background-color: #355ab8; color: #ffffff; border-radius: 7px; padding: 12px;">${titleMessage}</h2>
        ${todayHTML}
    </body>
    `;
}

async function startSection() {
    try {
        await checkJobOlxGlobal();
        await checkJobOlxFilter();
        await checkJobPracaPLFilter();
    } catch (error) {
        console.error("Błąd podczas sesji:", error);
    }
}

async function collectingData() {
    while (scrapingData <= 10) {
        await startSection();
        scrapingData++;
    }
}

async function startCronJob() {
    console.log(`Zbieram dane ... przez 5 minut`);
    // await collectingData();
    console.log(`Dane zebrane`);
    await startSection();
    await filterArticles();
    const job = new CronJob(
        "0 * * * *",
        async function () {
            await startSection();
            await filterArticles();
        },
        null,
        true,
        "Europe/Warsaw"
    );

    job.start();
}

startCronJob();
