# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Google Apps Script (GAS)** web app — a point-of-sale system for 3 Star Kids, a kids' play area business. All code runs inside Google Apps Script; there is no local build, test, or lint pipeline. Changes must be copy-pasted into the GAS editor and deployed as a web app.

## Deployment

- Open [script.google.com](https://script.google.com), select the project
- Copy each file (`Code.gs`, `index.html`, `js.html`, `css.html`, `dashboard.html`, `image.html`) into the corresponding GAS file
- Deploy → Manage deployments → Update (or New deployment for a new URL)
- Dashboard URL: `https://script.google.com/macros/s/<ID>/exec?page=dashboard`
- POS URL: `https://script.google.com/macros/s/<ID>/exec`

## File Structure (`app/`)

| File | Role |
|---|---|
| `Code.gs` | Server-side GAS: routing, sheet read/write, all backend functions |
| `index.html` | POS UI shell — buttons, layout, receipt DOM |
| `js.html` | All client-side JS — SETTINGS, item logic, submit flow, receipt render |
| `css.html` | Styles including `@media print` for thermal receipt |
| `dashboard.html` | Read-only management dashboard (real-time + 30-day history) |
| `image.html` | Receipt logo (base64 data URI) |

`real-time/` is an older experimental folder — not used in production.

## Google Sheet Structure

**Spreadsheet name format:** `ProjectNo_Location_Date` — parsed by `getSpreadSheetDetails()` to populate the header.

**Daily sheets** are named `M-D-YYYY` (e.g. `5-9-2026`), auto-created on first transaction of the day. Column layout is fixed — backend functions reference columns by index:

| Col | Header | Key |
|---|---|---|
| A | Invoice Number | — |
| B | Day Tic | `ticket` |
| C | Combo Tic | `halfHourTicket` |
| D | Socks | `socks` |
| E | Honey Water | `honeyWater` |
| F | Anti Slip Socks | `antiSlipSocks` |
| G | Hand Balloon | `handBalloon` |
| H | Custom Doll | `customDollAmount` |
| I | M.Water | `minaralWater` |
| J | K.Car | `electricalCar` |
| K | Workshop | `workshopAmount` |
| L | B.House | `bubbleHouse` |
| M | Payment Type | `paymentType` |
| N | Amount | `total` |
| O | Time | `time` |
| P | Description | `desc` |

**`findTotalTngCash`** hardcodes `dayDataPaymentTypeColLocation = 12` (col M) and `dayDataAmountColLocation = 13` (col N). Update these constants if columns ever change.

**Other sheets:** `Summary` (one row per day, written by `updateSummary()`), `today_sales` (live dashboard data in B2:B13, written by `calcTodayCurrentSales()` after every transaction).

## Key Architecture Patterns

### Adding / renaming an item
Changes must be made in **4 places**:
1. `SETTINGS` in `js.html` — add/update the price key
2. `updateProgramDetails(key, name)` call at the bottom of `js.html` — registers the item
3. `Code.gs` `processForm()` — header row label + `formObject.<key>` in `appendRow`
4. `Code.gs` `updateSummary()` / `calcTodayCurrentSales()` — column reference for summary

For user-input-price items (like `workshopInput`, `customDoll`), also add:
- Input element in `index.html`
- `payload.<key>Amount = document.getElementById('<key>Input').value` in `details.submitForm()` in `js.html`
- Use `formObject.<key>Amount` (not `formObject.<key>`) in `Code.gs`

### `updateProgramDetails(key, name)` factory
All product buttons share this factory. It registers the key in `priceLabel.allLabel` and returns `{ add, deduct, getName, getHtml }`. `details.drawList()` iterates `details.object` keys and calls `getHtml()` for each — add a new `if (key === '...')` block for user-input-price items that need custom HTML (see `workshopInput` / `customDoll` pattern).

### `paymentType` — use `paymentType.value`, not `this.value`
Arrow functions don't bind `this`. The `set()` and `get()` methods reference `paymentType.value` directly.

### Submit flow
`details.submitForm()` → builds `payload` + `priceSnapshot` + `itemsForReceipt` → calls `handleFormSubmit()` → calls `processForm(payload)` on the server → on success: optionally renders and prints receipt (if `SETTINGS.printReceiptEnabled`), then calls `logging.add()` and `details.reset()`.

### Receipt printing
Controlled by `SETTINGS.printReceiptEnabled` in `js.html`. Set to `false` for locations without a printer. The receipt DOM (`#receipt`) lives off-screen in `index.html` and is made visible only during `window.print()`.

### Dashboard data
`getDashboardData()` in `Code.gs` scans all sheets matching `/^\d{1,2}-\d{1,2}-\d{4}$/`, sorts descending, takes last 30, and returns structured data. The dashboard auto-refreshes every 30 seconds via `google.script.run`.

### Version display
Set in `js.html`: `document.getElementById('appTitle').innerText = '3 Star Kids Sales v3.2'`. The `#appTitle` element is in `index.html`.

### Holiday / weekend pricing
`SETTINGS.holidayDates` (format `'M-D-YYYY'`) marks days as weekend-priced. Weekdays are Mon–Thu only (`[1,2,3,4].includes(day)`); Fri/Sat/Sun and holidays use `weekendsTicket`/`weekendsHalfHourTicket`.
