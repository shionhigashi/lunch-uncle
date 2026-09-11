import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatForecast,
  formatBusArrivals,
  formatPlaces,
  haversineMetres,
  CT_HUB_2,
} from "../src/tools.js";

test("formatForecast picks the requested area", () => {
  const payload = {
    data: {
      items: [
        {
          valid_period: { text: "12 pm to 2 pm" },
          forecasts: [
            { area: "Geylang", forecast: "Fair" },
            { area: "Kallang", forecast: "Light Rain" },
          ],
        },
      ],
    },
  };

  assert.deepEqual(formatForecast(payload, "Kallang"), {
    area: "Kallang",
    forecast: "Light Rain",
    valid_period: "12 pm to 2 pm",
  });
});

test("formatBusArrivals converts durations to whole minutes", () => {
  const payload = {
    services: [
      {
        no: "13",
        next: { duration_ms: 100_798 },
        subsequent: { duration_ms: 1_210_000 },
      },
      { no: "107M", next: { duration_ms: 30_000 }, subsequent: null },
    ],
  };

  assert.deepEqual(formatBusArrivals(payload, "07371"), {
    stop_code: "07371",
    services: [
      { service: "13", next_min: 2, subsequent_min: 20 },
      { service: "107M", next_min: 1, subsequent_min: null },
    ],
  });
});

test("haversineMetres measures CT Hub 2 to Lavender MRT at under 600 m", () => {
  const ctHub2 = { latitude: 1.3115, longitude: 103.8615 };
  const lavenderMrt = { latitude: 1.3073, longitude: 103.8631 };
  const distance = haversineMetres(ctHub2, lavenderMrt);
  assert.ok(distance > 400 && distance < 550, `got ${distance}`);
});

test("formatPlaces keeps the open-now flag from the Places response", () => {
  const places = [
    {
      displayName: { text: "Berseh Food Centre" },
      rating: 4.3,
      location: { latitude: 1.3082, longitude: 103.8583 },
      currentOpeningHours: { openNow: true },
    },
    {
      displayName: { text: "Closed Kopitiam" },
      rating: 3.9,
      location: { latitude: 1.3115, longitude: 103.8615 },
      currentOpeningHours: { openNow: false },
    },
    // No opening hours in the response: unknown, not closed.
    {
      displayName: { text: "Mystery Stall" },
      location: { latitude: 1.3115, longitude: 103.8615 },
    },
  ];

  const formatted = formatPlaces(places, CT_HUB_2);

  assert.equal(formatted[0].open_now, true);
  assert.equal(formatted[1].open_now, false);
  assert.equal(formatted[2].open_now, null);
  assert.equal(formatted[2].rating, null);
  assert.equal(formatted[2].distance_m, 0);
  assert.equal(formatted[0].name, "Berseh Food Centre");
});
