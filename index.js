#!/usr/bin/env node

var inquirer = require('inquirer');
const check = require('./check');

(async function() {
    let plate, vin, year;

    // Check for command line arguments
    if (process.argv.length >= 5) {
        plate = process.argv[2];
        vin = process.argv[3];
        year = process.argv[4];
        console.log(`Using arguments: Plate=${plate}, VIN=${vin}, Year=${year}`);
    } else {
        var questions = [
            {
                type: 'input',
                name: 'plate',
                message: "What is the vehicle's plate number?",
            },
            {
                type: 'input',
                name: 'vin',
                message: "What is the vehicle's VIN number?",
            },
            {
                type: 'input',
                name: 'year',
                message: "What's the first registration year?",
                validate: year => {
                    if (year > 1769 && year < new Date().getFullYear() + 1) {
                        return true;
                    }
                    return 'Please enter a valid year.';
                },
            },
        ];

        const answers = await inquirer.prompt(questions);
        plate = answers.plate;
        vin = answers.vin;
        year = answers.year;
    }

    try {
        await check(plate, vin, year);
    } catch (err) {
        console.error('Fatal error:', err.message);
        process.exit(1);
    }
})();
