# 3 Star Kids Sales

Point-of-sale web app for 3 Star Kids, a kids' play area business. Built on Google Apps Script (GAS) — no local build pipeline; all code runs inside the GAS editor.

## Files

| File | Role |
|---|---|
| `app/Code.gs` | Server-side GAS: routing, sheet read/write, all backend functions |
| `app/index.html` | POS UI shell — buttons, layout, receipt DOM |
| `app/js.html` | Client-side JS — SETTINGS, item logic, submit flow, receipt render |
| `app/css.html` | Styles including `@media print` for thermal receipt |
| `app/dashboard.html` | Read-only management dashboard (real-time + 30-day history) |
| `app/image.html` | Receipt logo (base64 data URI) |

> `real-time/` is an older experimental folder — not used in production.

## Deployment

1. Open [script.google.com](https://script.google.com) and select the project
2. Copy each file into the corresponding GAS file
3. **Deploy → Manage deployments → Update** (or New deployment for a new URL)

| URL | Path |
|---|---|
| POS | `https://script.google.com/macros/s/<ID>/exec` |
| Dashboard | `https://script.google.com/macros/s/<ID>/exec?page=dashboard` |

## Google Sheet Structure

**Spreadsheet name format:** `ProjectNo_Location_Date` — parsed by `getSpreadSheetDetails()` to populate the POS header.

### Daily sheets (`M-D-YYYY`)

Auto-created on first transaction of the day. Column layout:

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

### Other sheets

| Sheet | Purpose |
|---|---|
| `Summary` | One row per day, written by `updateSummary()` via the Close Daily Sales button |
| `today_sales` | Live data in B2:B13, updated after every transaction by `calcTodayCurrentSales()` |

**`today_sales` row mapping (column A labels → column B values):**

| Row | Label | Source column |
|---|---|---|
| B2 | Total Sales | N |
| B3 | Cash | M/N |
| B4 | TNG | M/N |
| B5 | Credit Card | M/N |
| B6 | Headcount | B+C |
| B7 | Socks | D+F |
| B8 | Honey Water | E |
| B9 | Mineral Water | I |
| B10 | Electrical Car | J |
| B11 | Workshop | K |
| B12 | Bubble House | L |
| B13 | Custom Doll | H |

## Pricing & Settings

All prices and toggles are in `SETTINGS` inside `app/js.html`:

```js
const SETTINGS = {
  weekdayTicket: 28,        // Mon–Thu
  weekendsTicket: 34,       // Fri/Sat/Sun + holidays
  weekdayHalfHourTicket: 48,
  weekendsHalfHourTicket: 54,
  socks: 4,
  honeyWater: 12,
  antiSlipSocks: 6,
  handBalloon: 4,
  minaralWater: 2,
  electricalCar: 20,
  bubbleHouse: 25,
  holidayDates: ['16-9-2024', '17-9-2024'], // M-D-YYYY
  printReceiptEnabled: true  // set false at locations without a printer
};
```

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `P` | Add Day Ticket |
| `L` | Add Combo Ticket |
| `O` | Add Socks |
| `Q` | Add Honey Water |
| `W` | Add Anti Slip Socks |
| `E` | Add Hand Balloon |
| `A` | Add Mineral Water |
| `S` | Add Electrical Car |
| `H` | Add Bubble House |
| `C` | Set payment: Cash |
| `T` | Set payment: TNG |
| `B` | Set payment: Credit Card |
| `Enter` | Submit form |
| `Esc` | Reset form |

## Adding or Renaming an Item

Changes must be made in **4 places**:

1. `SETTINGS` in `js.html` — add/update the price key
2. `updateProgramDetails(key, name)` call at the bottom of `js.html` — registers the item
3. `Code.gs` `processForm()` — header row label + `formObject.<key>` in `appendRow`
4. `Code.gs` `updateSummary()` / `calcTodayCurrentSales()` — column reference for summary

For user-input-price items (e.g. `workshopInput`, `customDoll`), also:
- Add an input element in `index.html`
- Set `payload.<key>Amount = document.getElementById('<key>Input').value` in `details.submitForm()` in `js.html`
- Use `formObject.<key>Amount` (not `formObject.<key>`) in `Code.gs`
- Add a custom `if (key === '...')` block in `details.drawList()` in `js.html`
