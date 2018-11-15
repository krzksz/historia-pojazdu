#!/usr/bin/env node

var inquirer = require("inquirer");

const check = require("./check");

var questions = [
  {
    type: "input",
    name: "plate",
    message: "What is the vehicle's plate number?"
  },
  {
    type: "input",
    name: "vin",
    message: "What is the vehicle's VIN number?"
  },
  {
    type: "input",
    name: "year",
    message: "What's the first registration year?",
    validate: year => {
      if (year > 1769 && year < new Date().getFullYear()) {
        return true;
      }

      return "Please enter a valid year.";
    }
  }
];

(async function() {
  const { plate, vin, year } = await inquirer.prompt(questions);
  await check(plate, vin, year);
})();
