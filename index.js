const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const CronJob = require("cron").CronJob;
const nodemailer = require("nodemailer");

let articules = [];
let checkArticules = [];
let onlyNewOfferts = [];

const urlOlx =
    "https://www.olx.pl/nieruchomosci/mieszkania/sprzedaz/siedlce/?search%5Bdist%5D=10&search%5Bfilter_float_price:to%5D=500000";

async function checkJobOlx() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(urlOlx, { waitUntil: "networkidle2" });

    await page.reload();
    let html = await page.evaluate(() => document.body.innerHTML);
    const $ = cheerio.load(html);
    $(".css-1sw7q4x", html).each(function () {
        const title = $(this).find("h6").text();
        let url = $(this).find("a").attr("href");
        let link = `https://www.olx.pl/${url}`;
        const pln = $(this).find("p").not("span").text();
        const date = $(this).find(".css-1ioks24-TextStyled").text();
        if (url != undefined) {
            articules.push({
                title,
                link,
                pln,
                date,
            });
        }
    });
    await browser.close();
}

async function filterArticules() {
    articules = articules.filter(
        (value, index, self) =>
            index ===
            self.findIndex(
                (t) => t.title === value.title && t.date === value.date
            )
    );

    onlyNewOfferts = articules.filter(
        ({ title: id1 }) =>
            !checkArticules.some(({ title: id2 }) => id2 === id1)
    );

    if (articules.length !== checkArticules.length) {
        onlyNewOffertsMail();
        checkArticules = articules;
        checkArticules = checkArticules.filter(
            (value, index, self) =>
                index ===
                self.findIndex(
                    (t) => t.title === value.title && t.date === value.date
                )
        );
    }
    console.log(onlyNewOfferts.length);
}

async function onlyNewOffertsMail() {
    let dateHTML = "";
    for (let i = 0; i < onlyNewOfferts.length; i++) {
        dateHTML += `
        <div class="wrapper">
            <div class="info">
                <h4>${onlyNewOfferts[i].title}</h4>
                <p>${onlyNewOfferts[i].date}</p>
            </div>
            <div class="links">
                <p>${onlyNewOfferts[i].pln}</p>
                <button><a href="${onlyNewOfferts[i].link}">Szczegóły</a></button>
            </div>
        </div>
        <div class="underline"></div>
        `;
    }

    let transporter = nodemailer.createTransport({
        service: `gmail`,
        auth: {
            user: "infokwbot@gmail.com",
            pass: "cqkwmnwiugujvkou",
        },
    });

    let info = await transporter.sendMail({
        from: '"KW" <infokwbot@gmail.com>',
        to: "konradwiel@interia.pl",
        subject: `Znaleziono (${onlyNewOfferts.length}) oferty`,
        html: `
        <style>
        * {
            box-sizing: border-box;
            padding: 0;
            margin: 0;
        }
        h2{
            color: rgb(67, 105, 163);
            font-size: 1.8rem;
            text-align: center;
            margin: 25px 0 35px;
            font-family: sans-serif;
        }
    
        .wrapper {
            display: flex;
            align-items: center;
            justify-content: space-between;
            max-width: 900px;
            margin: 0 auto;
            margin-bottom: 30px;
    
        }
    
        .info{
            text-align: start;
            font-size: 102%;
            padding: 5px;
            width: 58%
        }
    
        .links{
            display: flex;
            flex-direction: column;
            text-align: center;
            align-items: center;
            justify-content: center;
            width: 33%;
    
        }
    
        button {
            padding: 7px 18px;
            background-color: rgb(67, 105, 163);
            font-size: 103%;
            border: none;
            outline: none;
            border-radius: 7px;
            cursor: pointer;
        }
        
        a {
            color: inherit;
            color: white;
            text-decoration: none;
        }
        
        .underline{
            position: relative;
            height: 2px;
            width: 40%;
            margin: 30px auto;
            background-color: rgb(67, 105, 163);
        }
    </style>
    
    <body>
        <h2>Nowe Oferty:</h2>
        ${dateHTML}
    </body>
         `,
    });

    console.log(`Mesage Send to KW`, info.messageId);
}

async function startTracking() {
    let job = new CronJob(
        "*/20 * * * * *",
        async function () {
            checkJobOlx();
            filterArticules();
        },
        null,
        true,
        null,
        null,
        true
    );
    job.start();
}
startTracking();
