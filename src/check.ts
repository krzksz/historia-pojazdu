import axios from "axios";
import { CookieJar } from "tough-cookie";
import https from "https";

const daysInMonth = (month: number, year: number): number => new Date(year, month, 0).getDate();
const zeroPad = (number: number | string): string => ("0" + number).slice(-2);
const formatDisplayDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-");
  return `${day}.${month}.${year}`;
};

const generateDates = (year: number | string): string[] => {
  const dates: string[] = [];
  const y = typeof year === "string" ? parseInt(year) : year;
  for (let month = 1; month <= 12; month++) {
    for (let day = 1; day <= daysInMonth(month, y); day++) {
      dates.push(`${y}-${zeroPad(month)}-${zeroPad(day)}`);
    }
  }
  return dates;
};

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export default async function check(plate: string, vin: string, year: string | number): Promise<void> {
  console.log(`Szukanie dla roku ${year} (sesja na żądanie, 1s odstępu)...`);

  const sslAgent = new https.Agent({
    ciphers: "DEFAULT@SECLEVEL=1",
    rejectUnauthorized: false,
    keepAlive: true,
  });

  const browserHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
    Connection: "keep-alive",
    "sec-ch-ua":
      '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    Accept: "application/json, text/plain, */*",
  };

  const client = axios.create({
    httpsAgent: sslAgent,
    headers: browserHeaders,
    maxRedirects: 15,
    validateStatus: (status) => status < 500,
  });

  const dates = generateDates(year);
  const apiVersion = "1.0.20";
  const apiBase = `https://moj.gov.pl/nforms/api/HistoriaPojazdu/${apiVersion}`;
  const initialEngineUrl =
    "https://moj.gov.pl/uslugi/engine/ng/index?xFormsAppName=HistoriaPojazdu&xFormsOrigin=EXTERNAL";
  const enginePostUrl =
    "https://moj.gov.pl/uslugi/engine/ng/index?xFormsAppName=HistoriaPojazdu&xFormsOrigin=EXTERNAL#";
  const engineReferer =
    "https://moj.gov.pl/nforms/engine/ng/index?xFormsAppName=HistoriaPojazdu";

  for (const date of dates) {
    process.stdout.write(
      `\r[${formatDisplayDate(date)}] Sprawdzanie...                                `,
    );

    const jar = new CookieJar();
    const timestamp = Date.now();
    const nf_wid = `HistoriaPojazdu:${timestamp}`;

    const request = async (url: string, options: { method?: string; data?: any; headers?: any } = {}) => {
      const { method = "GET", data = null, headers = {} } = options;
      const cookies = await jar.getCookieString(url);
      const mergedHeaders = { ...headers, Cookie: cookies };
      const resp = await client({
        url,
        method,
        data,
        headers: mergedHeaders,
      });
      if (resp.headers["set-cookie"]) {
        for (const c of resp.headers["set-cookie"]) {
          await jar.setCookie(c, url);
        }
      }
      return resp;
    };

    try {
      // Handshake (Silent)
      await request("https://historiapojazdu.gov.pl/strona-glowna", {
        headers: { Accept: "text/html" },
      });
      await request(initialEngineUrl, { headers: { Accept: "text/html" } });

      const formBody = `NF_WID=${encodeURIComponent(nf_wid)}`;
      await request(enginePostUrl, {
        method: "POST",
        data: formBody,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Origin: "https://moj.gov.pl",
          Referer: initialEngineUrl,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        },
      });

      const apiHeaders = {
        Referer: engineReferer,
        Origin: "https://moj.gov.pl",
        nf_wid: nf_wid,
      };

      await request(`${apiBase}/translations/pl`, { headers: apiHeaders });
      const initRes = await request(`${apiBase}/init-data`, {
        headers: apiHeaders,
      });

      if (initRes.status !== 200) {
        process.stdout.write(`\n[! Błąd połączenia: ${initRes.status}]\n`);
        await delay(2000);
        continue;
      }

      const cookies = await jar.getCookies("https://moj.gov.pl");
      const xsrf = cookies.find((c) => c.key.toLowerCase() === "xsrf-token");
      if (!xsrf) throw new Error("Brak ciasteczka XSRF");

      // Vehicle Search
      const resp = await client.post(
        `${apiBase}/data/vehicle-data`,
        {
          registrationNumber: plate,
          VINNumber: vin,
          firstRegistrationDate: date,
        },
        {
          headers: {
            ...apiHeaders,
            "x-xsrf-token": xsrf.value,
            "Content-Type": "application/json",
            Cookie: await jar.getCookieString(`${apiBase}/data/vehicle-data`),
          },
        },
      );

      if (resp.status === 200) {
        const data = resp.data;
        // FLEXIBLE SUCCESS CHECK:
        // Browser trace showed 'technicalData' at root for success
        if (
          data &&
          (data.technicalData || data.vehicle || data.registrationNumber)
        ) {
          process.stdout.write("\n");
          console.log(`\x1b[32m>>> ZNALEZIONO DOPASOWANIE: ${formatDisplayDate(date)} <<<\x1b[0m`);

          const tech = data.technicalData?.basicData || data.vehicle;
          if (tech) {
            console.log(
              `Pojazd: ${tech.make || tech.brand} ${tech.model || ""}`,
            );
          }
          return;
        }
      } else if (resp.status === 404) {
        // Date rejected, keep going
      } else if (resp.status === 429) {
        process.stdout.write("\nZbyt wiele zapytań. Czekam 30s...\n");
        await delay(30000);
      } else if (resp.status === 406) {
        process.stdout.write(
          `\n[! Błąd 406 przy ${formatDisplayDate(date)} - odrzucono połączenie]\n`,
        );
        await delay(2000);
      }
    } catch (e) {
      // Silently retry or skip if transient
    }

    await delay(500); // 0.5s delay
  }
  process.stdout.write("\nNie znaleziono dopasowania.\n");
};
