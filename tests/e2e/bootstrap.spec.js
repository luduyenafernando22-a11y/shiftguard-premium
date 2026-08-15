import { test, expect } from "@playwright/test";

const states = [
  { theme: "light", lang: "en", heading: "Shift monitoring" },
  { theme: "dark", lang: "en", heading: "Shift monitoring" },
  { theme: "light", lang: "de", heading: "Schichtüberwachung" },
  { theme: "dark", lang: "de", heading: "Schichtüberwachung" }
];

async function installBootstrapTrace(page) {
  await page.addInitScript(() => {
    window.__SHIFTGUARD_TRACE__ = [];

    const originalSetAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, value) {
      const result = originalSetAttribute.call(this, name, value);

      if (this === document.documentElement && (name === "data-theme" || name === "lang")) {
        window.__SHIFTGUARD_TRACE__.push({
          time: performance.now(),
          theme: document.documentElement.getAttribute("data-theme"),
          lang: document.documentElement.getAttribute("lang")
        });
      }

      return result;
    };

    window.__SHIFTGUARD_TRACE__.push({
      time: performance.now(),
      theme: document.documentElement.getAttribute("data-theme"),
      lang: document.documentElement.getAttribute("lang")
    });
  });
}

for (const state of states) {
  test(`inicia sem FOUC em ${state.theme} + ${state.lang}`, async ({ page }) => {
    await installBootstrapTrace(page);

    await page.addInitScript(({ theme, lang }) => {
      localStorage.setItem("shiftguard-theme", theme);
      localStorage.setItem("shiftguard-lang", lang);
    }, state);

    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.locator("html")).toHaveAttribute("data-theme", state.theme);
    await expect(page.locator("html")).toHaveAttribute("lang", state.lang);
    await expect(page.locator("#root")).not.toBeEmpty();
    await expect(page.locator("body")).toContainText(state.heading);

    const trace = await page.evaluate(() => window.__SHIFTGUARD_TRACE__);
    const initializedStates = trace.filter((entry) => entry.theme && entry.lang);

    expect(initializedStates.length).toBeGreaterThan(0);
    expect(new Set(initializedStates.map((entry) => entry.theme))).toEqual(new Set([state.theme]));

    const allowedLanguages = state.lang === "de" ? new Set(["en", "de"]) : new Set(["en"]);
    expect(new Set(initializedStates.map((entry) => entry.lang))).toEqual(allowedLanguages);
    expect(initializedStates.at(-1).lang).toBe(state.lang);
  });
}

test("mantém o estado correto sob carregamento lento", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("shiftguard-theme", "dark");
    localStorage.setItem("shiftguard-lang", "de");
  });

  await page.route("**/*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 80));
    await route.continue();
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.locator("body")).toContainText("Schichtüberwachung");
});

test("preserva o Service Worker e o shell offline", async ({ page, context }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const hasServiceWorker = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return false;
    await navigator.serviceWorker.ready;
    const registrations = await navigator.serviceWorker.getRegistrations();
    return registrations.length > 0;
  });

  expect(hasServiceWorker).toBe(true);

  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(page.locator("#root")).not.toBeEmpty();
  await expect(page.locator("html")).toHaveAttribute("data-theme", /light|dark/);
});
