const cheerio = require('cheerio'); // Basically jQuery for node.js
const rp = require('request-promise-native');

const fieldPrefix = '_historiapojazduportlet_WAR_historiapojazduportlet_';

const daysInMonth = (month, year) => new Date(year, month, 0).getDate();

const getFormUrl = $form => $form.attr('action');

const getFormData = ($form, plate, vin, date) => {
    const data = $form.serializeArray().reduce((data, field) => {
        data[field.name] = field.value;

        return data;
    }, {});

    data[`${fieldPrefix}:rej`] = plate;
    data[`${fieldPrefix}:vin`] = vin;
    data[`${fieldPrefix}:data`] = date;
    data[`${fieldPrefix}:btnSprawdz`] = 'Sprawdź pojazd »';

    return data;
};

const zeroPad = number => ('0' + number).slice(-2);

const generateDates = year => {
    const dates = [];
    for (let month = 1; month <= 12; month++) {
        for (let day = 1; day <= daysInMonth(month, year); day++) {
            dates.push(`${zeroPad(day)}.${zeroPad(month)}.${year}`);
        }
    }
    return dates;
};

module.exports = async function check(plate, vin, year) {
    const $ = await rp({
        uri: 'https://historiapojazdu.gov.pl/strona-glowna',
        transform: body => cheerio.load(body),
        strictSSL: false,
        jar: true,
    });

    const $form = $(`#${fieldPrefix}\\:formularz`);
    const uri = getFormUrl($form);
    const dates = generateDates(year);

    for (const date of dates) {
        console.log(`Checking database for ${date}...`);
        const response = await rp({
            uri,
            strictSSL: false,
            jar: true,
            method: 'POST',
            form: getFormData($form, plate, vin, date),
        });

        if (response.includes('raport-main-information')) {
            console.log(`Valid first registration date found: ${date}`);
            return;
        }
    }
};
