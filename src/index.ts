import inquirer from "inquirer";

import { check } from "./check";

(async function () {
  let plate: string, vin: string, year: string | number;

  // Check for command line arguments
  if (process.argv.length >= 5) {
    plate = process.argv[2];
    vin = process.argv[3];
    year = process.argv[4];
    console.log(`Używam argumentów: Tablica=${plate}, VIN=${vin}, Rok=${year}`);
  } else {
    var questions = [
      {
        type: "input",
        name: "plate",
        message: "Jaki jest numer rejestracyjny pojazdu?",
      },
      {
        type: "input",
        name: "vin",
        message: "Jaki jest numer VIN pojazdu?",
      },
      {
        type: "input",
        name: "year",
        message: "Jaki jest rok pierwszej rejestracji?",
        validate: (year: string) => {
          const y = parseInt(year);
          if (y > 1769 && y < new Date().getFullYear() + 1) {
            return true;
          }
          return "Proszę podać poprawny rok.";
        },
      },
    ];

    const answers = await inquirer.prompt<{
      plate: string;
      vin: string;
      year: string;
    }>(questions);
    plate = answers.plate;
    vin = answers.vin;
    year = answers.year;
  }

  try {
    await check(plate, vin, year.toString());
  } catch (err) {
    if (err instanceof Error) {
      console.error("Błąd krytyczny:", err.message);
    } else {
      console.error("Błąd krytyczny:", err);
    }
    process.exit(1);
  }
})();
