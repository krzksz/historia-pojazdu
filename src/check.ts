const daysInMonth = (month: number, year: number): number =>
  new Date(year, month, 0).getDate();
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

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function check(
  plate: string,
  vin: string,
  year: string | number,
): Promise<void> {
  console.log(
    `Szukamy daty pierwszej rejestracji pojazdu w ${year} roku, szacowany czas: około 15 minut.`,
  );

  const browserHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
    Connection: "keep-alive",
    "sec-ch-ua":
      '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
  };

  const dates = generateDates(year);
  const initialEngineUrl =
    "https://moj.gov.pl/uslugi/engine/ng/index?xFormsAppName=HistoriaPojazdu&xFormsOrigin=EXTERNAL";
  const enginePostUrl =
    "https://moj.gov.pl/uslugi/engine/ng/index?xFormsAppName=HistoriaPojazdu&xFormsOrigin=EXTERNAL#";
  const engineReferer =
    "https://moj.gov.pl/nforms/engine/ng/index?xFormsAppName=HistoriaPojazdu";

  const cookies = new Map<string, string>();

  const getCookieString = () => {
    return Array.from(cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  };

  const saveCookies = (setCookie: string | null) => {
    if (!setCookie) return;
    const parts = setCookie.split(/,(?=\s*[a-zA-Z0-9_-]+=)/);
    for (const part of parts) {
      const cookie = part.trim().split(";")[0];
      const [name, ...valueParts] = cookie.split("=");
      if (name) cookies.set(name.trim(), valueParts.join("=").trim());
    }
  };

  const request = async (
    url: string,
    options: { method?: string; body?: any; headers?: any } = {},
  ): Promise<Response> => {
    let currentUrl = url;
    let currentMethod = options.method || "GET";
    let currentBody = options.body || null;
    let redirectCount = 0;

    while (redirectCount < 15) {
      const mergedHeaders = {
        ...browserHeaders,
        ...options.headers,
        Cookie: getCookieString(),
      };

      const resp = await fetch(currentUrl, {
        method: currentMethod,
        body: currentBody,
        headers: mergedHeaders,
        redirect: "manual",
      });

      const h: any = resp.headers;
      const setCookies = h.getSetCookie
        ? h.getSetCookie()
        : [h.get("set-cookie")];
      for (const sc of setCookies) {
        if (sc) saveCookies(sc);
      }

      if (resp.status >= 300 && resp.status < 400) {
        let location = resp.headers.get("location");
        if (!location) return resp;

        if (!location.startsWith("http")) {
          const origin = new URL(currentUrl).origin;
          location = origin + (location.startsWith("/") ? "" : "/") + location;
        }

        currentUrl = location;
        redirectCount++;

        if (
          resp.status === 303 ||
          (resp.status <= 302 && currentMethod === "POST")
        ) {
          currentMethod = "GET";
          currentBody = null;
        }
        continue;
      }

      return resp;
    }
    throw new Error("Zbyt wiele przekierowań");
  };

  let apiBase = "";
  let nf_wid = "";
  let apiHeaders: any = {};

  const initSession = async () => {
    cookies.clear();
    await request("https://historiapojazdu.gov.pl/strona-glowna", {
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
      },
    });
    await request(initialEngineUrl, {
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
      },
    });

    nf_wid = `HistoriaPojazdu:${Date.now()}`;
    const formBody = new URLSearchParams();
    formBody.append("NF_WID", nf_wid);

    const postRes = await request(enginePostUrl, {
      method: "POST",
      body: formBody,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: "https://moj.gov.pl",
        Referer: initialEngineUrl,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
      },
    });

    if (postRes.status === 429) {
      throw new Error("429");
    }

    const html = await postRes.text();
    const versionMatch = html.match(
      /\/nforms\/api\/HistoriaPojazdu\/(.*?)\/resource/,
    );
    if (!versionMatch) {
      if (html.includes("Zbyt wiele zapytań")) throw new Error("429");
      throw new Error("Nie wyodrębniono wersji API. Możliwa blokada IP.");
    }
    const apiVersion = versionMatch[1];
    apiBase = `https://moj.gov.pl/nforms/api/HistoriaPojazdu/${apiVersion}`;

    apiHeaders = {
      Referer: engineReferer,
      Origin: "https://moj.gov.pl",
      nf_wid: nf_wid,
      Accept: "application/json, text/plain, */*",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
    };

    await request(`${apiBase}/translations/pl`, { headers: apiHeaders });
    const initRes = await request(`${apiBase}/init-data`, {
      headers: apiHeaders,
    });

    if (initRes.status !== 200) {
      throw new Error(`Błąd init-data: ${initRes.status}`);
    }
  };

  const ensureSession = async (attempt: number = 1): Promise<void> => {
    if (attempt > 10) {
      throw new Error("Nie udało się zainicjować sesji po 10 próbach.");
    }
    try {
      await initSession();
    } catch (err: any) {
      if (err.message.includes("429")) {
        process.stdout.write(
          `\n[Serwis] Zbyt wiele zapytań (429). Odczekuję 60s (próba inicjalizacji ${attempt}/10)...\n`,
        );
        await delay(60000);
      } else {
        process.stdout.write(
          `\n[Serwis] Błąd sesji (${err.message}). Odczekuję 30s (próba inicjalizacji ${attempt}/10)...\n`,
        );
        await delay(30000);
      }
      await ensureSession(attempt + 1);
    }
  };

  const checkDate = async (
    date: string,
    attempt: number = 1,
  ): Promise<boolean> => {
    if (attempt > 3) {
      process.stdout.write(
        `\n[! Pominięto date ${formatDisplayDate(
          date,
        )} po 3 nieudanych próbach]\n`,
      );
      return false;
    }

    process.stdout.write(
      `\r[${formatDisplayDate(date)}] Sprawdzanie...${
        attempt > 1 ? ` (próba ${attempt})` : "              "
      }`,
    );

    try {
      const xsrf = cookies.get("XSRF-TOKEN") || cookies.get("xsrf-token");
      if (!xsrf) {
        process.stdout.write(
          "\nObecna sesja nie posiada XSRF. Wznawianie sesji...\n",
        );
        await ensureSession();
        return await checkDate(date, attempt + 1);
      }

      const resp = await request(`${apiBase}/data/vehicle-data`, {
        method: "POST",
        body: JSON.stringify({
          registrationNumber: plate,
          VINNumber: vin,
          firstRegistrationDate: date,
        }),
        headers: {
          ...apiHeaders,
          "x-xsrf-token": xsrf,
          "Content-Type": "application/json",
        },
      });

      if (resp.status === 200) {
        const data: any = await resp.json();
        if (
          data &&
          (data.technicalData || data.vehicle || data.registrationNumber)
        ) {
          process.stdout.write("\n");
          console.log(
            `\x1b[32m>>> ZNALEZIONO DOPASOWANIE: ${formatDisplayDate(
              date,
            )} <<<\x1b[0m`,
          );

          const tech = data.technicalData?.basicData || data.vehicle;
          if (tech) {
            console.log(
              `Pojazd: ${tech.make || tech.brand} ${tech.model || ""}`,
            );
          }
          return true;
        }
        return false;
      } else if (resp.status === 404 || resp.status === 400) {
        return false;
      } else if (resp.status === 429) {
        process.stdout.write("\nLimit zapytań (429). Czekam 30s...\n");
        await delay(30000);
        return await checkDate(date, attempt + 1);
      } else if (
        resp.status === 401 ||
        resp.status === 403 ||
        resp.status === 406 ||
        resp.status === 419
      ) {
        process.stdout.write(
          `\nSesja wygasła lub odrzucona (${resp.status}). Odnawiam...\n`,
        );
        await ensureSession();
        return await checkDate(date, attempt + 1);
      } else {
        process.stdout.write(
          `\n[! Błąd HTTP ${resp.status} przy dacie ${formatDisplayDate(
            date,
          )}]. Czekam 5s...\n`,
        );
        await delay(5000);
        return await checkDate(date, attempt + 1);
      }
    } catch (e: any) {
      if (e.message.includes("przekierowań")) {
        process.stdout.write("\nPętla przekierowań - odnawianie sesji...\n");
        await ensureSession();
        return await checkDate(date, attempt + 1);
      }
      process.stdout.write(`\n[! Błąd sieciowy: ${e.message}]. Czekam 5s...\n`);
      await delay(5000);
      return await checkDate(date, attempt + 1);
    }
  };

  try {
    await ensureSession();
  } catch (err: any) {
    console.error(
      `\n[!!!] Krytyczny błąd: Wiele prób inicjalizacji zawiodło. Script przerwany.`,
    );
    return;
  }

  for (const date of dates) {
    const found = await checkDate(date);
    if (found) {
      return;
    }
    await delay(2500);
  }

  process.stdout.write("\nNie znaleziono dopasowania w podanym roku.\n");
}
