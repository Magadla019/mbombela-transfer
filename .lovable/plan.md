# Mbombela Transfer - Final Build Plan

This is a large update, so I'll deliver it in 4 phases. Each phase is checked in the preview before the next one starts. The existing look stays as it is: dark #0A0A0A, red #E10600, the 9 restaurants, the PAXI yellow card, the payment photo cards and the delivered popup.

## Changes to your instructions (for safety and POPIA)
- **No open public reading of orders.** Customer phone numbers and addresses stay private. Popups and updates still arrive within about 3 seconds using the same secure refresh the site already uses. Open "realtime" on orders would let anyone read every customer's details.
- **Driver passwords are checked on the server.** Your browser only keeps a signed session, not the password itself, so a driver can't pretend to be another driver.
- **Clients find their orders through their signed-in account or the order they just placed, not by typing a phone number.** Otherwise anyone could type someone else's number and see their orders.
- **Prices are public and update live.** That's safe, because prices aren't private.

## Phase 1 - Clean slate + database
- Delete all orders, reviews, driver locations and stored photos.
- Add popup tracking fields, PAXI tracking/bag, assigned time and delivery type to orders.
- New tables: pricing (seeded with PAXI R60/80/110/150, Food R35, Receive R40, Send R40, Speed Point R35, Money Exchange R40), refresh logs and driver access.
- Result: dashboard shows 0 orders, R0 and "No sales yet".

## Phase 2 - Login routing + driver accounts
- Keep the Partner Access screen exactly as it is. Continue sends you to:
  - code 1141: the new Driver Control Center
  - partner code: the partner dashboard
  - a driver's own password: the driver home, with a "Complete your profile" sheet on first login
  - anything else: "Invalid code"
- Partner Settings gets a Driver Access Codes section: add a driver (type your own password, Generate, Copy), show/hide, copy, change and deactivate.
- One order, one driver: accepting is atomic. If another driver got there first, they see "Already taken" and the order disappears for everyone else.
- Each driver's stats count only their own orders. Partner totals add up all drivers.
- Driver Control Center tabs: Overview, Drivers, Driver Detail (date filters and income chart), Passwords, Leaderboard.

## Phase 3 - Popups, tracking, history
- The client and driver popups work on every page. They remember where each order is, so a client who was offline still gets the popup on client home next time.
- Flow: Arrived → Confirm → Cash/Card → Paid → driver sees "Money Received?" → Completed → delivered popup ("Your order has been delivered successfully." only). Proof photos are deleted after completion.
- Track Order: shows the active order, or "No Order Placed Yet 😔" with a Place Order button. Order History appears below it and also has its own /order-history page, with Rate Us buttons.

## Phase 4 - Analytics, Refresh Center, Pricing
- Shopify-style analytics:
  - date picker (Today through Last year, custom range, years 2006-2026)
  - live visitor count
  - Total sales, Total orders and Conversion, grouped by completion date
  - teal area chart that compares with the previous period (dotted line)
  - CSV export and an Orders to fulfill list
- Refresh Center (partner only): a two-step bottom sheet to clear Orders (New / Completed / Canceled / Paid / All), Clients, Drivers, Reviews or Revenue. Every action asks for confirmation. Full reset requires typing DELETE ALL. Every action is logged.
- Pricing tab: edit a price, add a custom label (yellow badge) and choose where it applies. Clients see the new price live with a "🔥 New Price Live" toast. PAXI bag prices come from this table.
- Google/Apple sign-in stays real, with no "coming soon" text.

## Technical notes
- Private order data only goes through signed server functions. Pricing gets public SELECT, and only staff can write it through a server function. Pricing is added to realtime.
- The driver_access password is stored hashed. Driver sessions use HMAC tokens that include driver_id.
- Accepting an order uses `update ... where driver_id is null returning`.
- Stored files are removed through the storage API, never by deleting storage.objects rows directly.
