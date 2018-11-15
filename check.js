const puppeteer = require("puppeteer");

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

async function fillForm(page, plate, vin, date) {
  await page.evaluate(plate => {
    document.querySelector(
      "#_historiapojazduportlet_WAR_historiapojazduportlet_\\:rej"
    ).value = plate;
  }, plate);

  await page.evaluate(vin => {
    document.querySelector(
      "#_historiapojazduportlet_WAR_historiapojazduportlet_\\:vin"
    ).value = vin;
  }, vin);

  await page.evaluate(date => {
    document.querySelector(
      "#_historiapojazduportlet_WAR_historiapojazduportlet_\\:data"
    ).value = date;
  }, date);

  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.click(
      "#_historiapojazduportlet_WAR_historiapojazduportlet_\\:btnSprawdz"
    )
  ]);
}

module.exports = async function check(plate, vin, year) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  let validDate = null;

  await page.goto("https://historiapojazdu.gov.pl/strona-glowna", {
    waitUntil: "domcontentloaded"
  });

  for (let month = 1; month <= 12 && !validDate; month++) {
    for (let day = 1; day <= daysInMonth(month, year) && !validDate; day++) {
      const date = `${("0" + day).slice(-2)}.${("0" + month).slice(
        -2
      )}.${year}`;
      console.log(`Checking first registration date ${date}...`);
      try {
        await fillForm(page, plate, vin, date);
        if ((await page.$("#dane-podstawowe")) !== null) {
          validDate = date;
        }
      } catch (error) {
        console.error(`Error for ${date}, you may want to check it manually.`);
      }
    }
  }

  if (validDate) {
    console.log(`Valid first registration date is ${validDate}.
Use following vehicle information to optain vehicle information:
Plate number:       ${plate}
VIN:                ${vin}
First registration: ${validDate}`);
  } else {
    console.log(
      `Couldn't find valid first registration date for year ${year}.`
    );
  }

  await browser.close();
};
