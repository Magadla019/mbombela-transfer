# Mbombela Transfer 

Build Mbombela Transfer full website - DARK THEME #0A0A0A, RED #E10600, WHITE. React + Tailwind + Framer Motion + Leaflet Map.



=== 1. SPLASH SCREEN - FIRST ===

Full screen 100vh 100vw, use EXACT biker image I uploaded as background object-fit cover, no crop, no filter, text in image stays.

No logo, no skip button, no scroll.

Show for 7 seconds then fade to /login. Use useEffect setTimeout 7000.



=== 2. LOGIN PAGE /login ===

Background same biker image full cover.

Top left logo: red map pin + white truck icon, text "Mbombela" white "Transfer" red #E10600 bold 20px position absolute top 20 left 20.

DESKTOP: login card left 30% width, 70% image visible. MOBILE: card bottom full width rounded top 32px.

CARD DESIGN CLONE MY SCREENSHOT EXACTLY:

Card bg #0F0F0F 85% + blur 20px, border 1px rgba(255,0,0,0.3) red glow, rounded 32px, padding 24px.

Toggle top: Clients active red gradient #E10600 to #8B0000 white text pill, Partners/Drivers grey #888 transparent.

If Clients tab: Show Welcome Back (Welcome white, Back red), 2 inputs dark #1A1A1A border #331111 rounded 24px h-56px Email/Phone + Password with eye icon, checkbox Keep me signed in red #E10600, Forgot red, Log In button red gradient full width rounded 24px h-56px -> goes to /client-home, divider Or Continue With, Google + Apple buttons dark red border, bottom Don't have account Sign Up red, Quick Track as Guest red -> /track-order

If Partners/Drivers tab: ONE field only Label "Partners / Drivers Access Code" input placeholder "Enter Access Code". Logic:

If "Mbombela Transfer 452" -> localStorage role=partner -> /partner-dashboard

If "Mbombela Transfer 1141" -> localStorage role=driver -> /driver-dashboard

Else shake error red "Invalid Access Code. Contact admin." Small text below "Partners: 452, Drivers: 1141 demo"



=== 3. CLIENT HERO /client-home ===

Full screen hero 100vh with same biker bg cover, top nav dark 90% blur h-72px border #222, left logo same, right button Request a Delivery red gradient pill.

Center: small pill red #E10600 with scooter icon "Mbombela Transfer", Title "Fast delivery." white 56px bold + "Every transfer." red same, subtitle "Packages, documents and business orders delivered to your door by trusted local riders across Nelspruit & Mbombela." grey 18px max-w 600 center.

2 buttons center 300px w 56px h: Request a Delivery -> red gradient -> /request-type, Track My Parcel transparent red border #E10600 white + pin red -> /track-order logic below.

Enable scroll after hero.



Below hero sections #0A0A0A:

- PAYMENT: Title "Cash On Delivery Only" white 32px red underline, 3 cards #161616 rounded 24px border #222: Speed Point Machine (credit-card red icon), Cash Payment (banknote), Package & Money Exchange (handshake) descriptions.

- 2 BUTTONS ROW: Receive an Order transparent red border -> /receive-parcel-form, Send an Order red gradient -> /send-parcel-form

- BRANDS: Bg #111111 p-80, pill red Food Delivery, Title "You want food we got you" white + red, grid 5 cols desktop 2 mobile cards #1A1A1A rounded 20px h-120px border #222 hover red glow: KFC, Nandos, Panarottos, Spur, Debonairs, Fish Aways, Galitos, Mugg & Bean, Salsa, Rocomamas - on click -> /food-order-form?brand=NAME

- PAXI: Card #161616 rounded 24px yellow accent #FFD700, icon package yellow, Title "Need to receive a PEP PAXI Parcel? We got you!" Button yellow #FFD700 black "Receive PAXI Package Only" -> /paxi-form

- TRADING HOURS: Banner #1A1A1A rounded 24px border #331111 flex: Clock red "Trading Days" + "Monday to Monday, 7am to 7pm" white + green pill Open 7 Days

- REVIEWS PREVIEW: Title "What our customers say", grid 3 cols cards #161616 rounded 20px stars yellow, text white, avatar red circle initial, read from localStorage mbombela_reviews approved only.



=== 4. REQUEST FLOW ===

/request-type: Bg biker blurred 10px dark overlay, card #161616 rounded 32px red glow p-32 title "What do you need?" 2 cards: Send a Parcel (box arrow up red) desc "I want to send something..." button red -> /send-parcel-form, Receive a Parcel (box arrow down) -> /receive-parcel-form



Package Type selector first in all forms: Grid 5 options Food, Envelope/Documents, Small Box, Books, Other (with text input if Other) icons selectable red border active.



/send-parcel-form and /receive-parcel-form: Dark #0A0A0A card #161616 rounded 24px max-w 600 center p-24. SEND: Pickup Address with Use my location, pickup details who/phone, Delivery Address, Receiver Name/Phone, Notes, weight/value. RECEIVE: Pickup Address "Where to collect from?" Shop name, what to collect receipt/contact, Your Delivery Address with current location, Your Name/Phone, Notes. Both end price estimate "Estimated: R45 - R80" and button "Confirm & Request Rider" red gradient -> creates order {id: Date.now(), customerName, pickupAddress, deliveryAddress, phone, amount: random 45-120, status: "pending", type: send/receive, driverLiveLocation, distance, eta} save to localStorage orders, trigger notification for partner/driver, then go to /track-order.



=== 5. FOOD FORM /food-order-form ===

Card #161616 rounded 32px max-w 600 p-32 title "Order from [brand]" from query param, toggle "I already ordered online" / "Order for me" red active. If already ordered: Upload Slip drag drop red dashed, order number, pickup address prefilled brand, delivery address phone name. If order for me: Textarea "What do you want? e.g., 2x Full Chicken" + "How much is it? R" + dropdown brands. Both delivery address phone notes. Button "Complete & Pay on WhatsApp" red -> save order type food brand status pending + window.open('https://wa.me/27727528011?text=Hi Mbombela Transfer! I want to order from ${brand}... Details: ${formData}', '_blank')



/paxi-form: Title "PEP PAXI Collection" fields: PEP Store name, PAXI Tracking/Slip Number, ID Number for collection, Your Full Name, Your ID, Delivery Address, Phone, Photo ID+Slip upload drag drop, Button "Request PAXI Collection" red -> save order type paxi pending.



=== 6. TRACKING /track-order + LIVE LOCATION ===

Check activeOrder from localStorage orders where status!= completed, last one.

If no active: Show modal centered #1A1A1A red border: Icon package empty, Title "No Order Placed - How?" Text "You don't have an active order. Place an order first to track." Button red "Place Order Now" -> /request-type

If pending: Modal "Order Pending" "Your order #XXXX is waiting for driver 2-5 mins..." loading.

If has active accepted/picked/delivering/arrived:

Top map 50vh: Use div mock map dark with street names like video, orange polyline #FF6B00 animated drawing, bike icon moving along line every 3s via setInterval updating lat/lng, zoom effect.

Below card #1A1A1A rounded top 24px: Estimated "11:00am" bold, Steps with dots line checkmarks:

Order confirmed ✔️ 09:41am

Driver accepted order ✔️ / pending

Rider has picked up order ✔️ or "55 minutes away - get ready"

Out for delivery pending

Also show "Package pickup ✔️ Package delivered pending 55 minutes away" "How far: 2.3km away" progress bar.

Driver card avatar name "Tom Sweden" Call button tel.

Bottom fixed button "Live Tracking" red #E10600 rounded 24px full width center map.

Live update distance ETA.

When status arrived: Auto show popup "Order Arrived! 🎉" text "Your driver delivered to [deliveryAddress]. Please confirm." Buttons Confirm & Complete green + Report Issue grey. On Confirm status=completed, move to Completed, add amount to analytics, confetti.



=== 7. DRIVER LOGIC /driver-dashboard + PARTNER /partner-dashboard ===

CLONE NEXORA IMAGE EXACTLY: Full dark #0A0A0A, left sidebar 260px #111111 border #222. Top logo "Mbombela Transfer" white ID 6935145 grey, dropdown arrow, red truck icon black square rounded 8px red glow replacing purple. Search bar #1A1A1A rounded 12px "Search" + ⌘K pill.

Sidebar menu: Home (house), Orders (box) + button, New (0), Accepted (3820), Completed (1019), Canceled (80), Paid (400), Notifications (bell), Performance (stack), Dashboard (grid), Reviews (comment), Clients (user), Analytics (chart), SEO (page), Company Wallet (wallet), Settings (gear) - REMOVED Messages completely. Grey #888 inactive white active, counts pill #1E1E1E. Active red highlight.

Main: Breadcrumb "Home / Order list", Title "Orders" 32px white subtitle grey. 3 cards top: Total Orders 248 +23.5% green chart, Order items over time 32 -16.1% red, Returns Orders 7 +1.6% yellow each #161616 rounded 16px border #222. Filter tabs All active white pill #2A2A2A others grey, dropdowns Customer/Payment/Payment Method #1A1A1A border #2A2A2A rounded 24px + Add filter.

Table header checkbox # Order ID # icon Customer user icon Total money icon Items stack Order Date calendar Payment payment icon grey 13px. Rows h-52px border #1A1A1A hover #161616 data like 4772827 John Smith $120.75 1 item 24 Jun 2024 9:23 pm Success pill olive #2A3320 text #A3C78A + VISA/GPay/ApplePay. 8 rows.

Partner: sees ALL sidebar items. Click order modal details. Analytics section: Business income only chart "How much made this month / How many paid / Revenue per month" filter Month/Week using Recharts, data from completed orders sum amounts. Wallet balance, Clients table registered, Reviews Management page: Title "Customer Reviews" stats Total Average Pending, tabs All/Pending/Approved, list cards from localStorage mbombela_reviews, buttons Approve green -> approved true Delete grey, notification bell when new review.



Driver dashboard: Same design but sidebar ONLY Home, Orders (New/Accepted/Completed/Canceled), Notifications, Performance, Settings. Orders New shows Accept Cancel red buttons. On Accept first show modal "Share your live location" Title "Location Required" "To accept you must share live location" buttons Allow red Deny grey. If Deny error "You cannot accept without location" stop. If Allow navigator.geolocation.watchPosition start updating driverLiveLocation every 3s simulate movement, status accepted. Then show Step 1 modal full dark Header "Step 1 of 2: PICKUP" pickup address copy + maps, phone call button, checklist proofs screenshot ID photo package confirm items, map mini red pin, button "I have Picked Package - Complete Pickup" red -> status picked. Step 2 modal "Step 2 of 2: DELIVERY" delivery address phone name amount COD details button "Package Delivered - Complete Delivery" red -> status arrived.

Notification: When new order placed, toast top right red + sound + browser Notification "🔔 New Order! #XXXX - 2.3km away - Accept now" with Accept button, bell icon red dot count. Use localStorage orders shared.

Logout button bottom sidebar clears role -> /login. Protect routes if no role redirect /login.



=== 8. REVIEWS PAGE /reviews + ABOUT + FOOTER - NO MESSAGES ANYWHERE ===

DELETE ALL internal messaging system. No Messages page, no chat.

/reviews: Dark #0A0A0A max-w 800 p-40 title "Leave a Review" 32px white subtitle grey average 4.9 stars yellow 127 reviews. Form card #161616 rounded 24px border #222 p-32: Star rating 5 clickable big yellow #FFD700 active grey #333, Name input dark #1A1A1A border #2A2A2A rounded 16px, Location dropdown Nelspruit/White River/Hazyview/Kabokweni, Service dropdown Food/Parcel Send/Receive/PAXI/Other, Review textarea h-120 placeholder, optional photo upload drag drop, Submit button red gradient full 56px. On submit save to localStorage mbombela_reviews {id, name, location, service, rating, text, date, approved:false, avatar: initial} toast "Thank you! Will show after approval" clear. Below grid review cards approved only #1A1A1A rounded 20px stars yellow.



/about: Dark #0A0A0A max-w 1000 p-80 hero logo big title "About Mbombela Transfer" white 40px red underline story "Mbombela Transfer is local delivery for Nelspruit & Mbombela. Packages, documents, food from KFC Nandos etc, PEP PAXI, cash on delivery with speed point machine. Monday to Monday 7am-7pm." 3 cards mission Fast Delivery lightning red, Trusted Riders shield, Cash on Delivery money.



FOOTER on all client pages: Bg #050505 border top #1A1A1A p-60 3 cols: Col1 logo Mbombela white Transfer red 24px bold desc grey "Fast delivery. Every transfer..." Trading Monday to Monday 7am-7pm clock red. Col2 Quick Links white bold: Request a Delivery /request-type, Track My Parcel /track-order, Food Delivery scroll to brands, PAXI Collection /paxi-form, Leave a Review /reviews, About Us /about. Col3 Customer Care white bold: WhatsApp/Calls 072 752 8011 tel:+27727528011, WhatsApp Button green #25D366 white "Chat on WhatsApp" rounded 24px window.open('https://wa.me/27727528011?text=Hi Mbombela Transfer, I need help'), Call or WhatsApp - Customer Care grey, info@mbombelatransfer.co.za. Bottom bar border #1A1A1A text © 2026 Mbombela Transfer Built for Mbombela.



FLOATING WHATSAPP: Fixed bottom right green #25D366 circle 60px WhatsApp icon white pulse shadow z-9999 on ALL client pages, on click wa.me/27727528011?text=Hi Mbombela Transfer! I have a question about my delivery. This replaces Messages.



Build fully functional with localStorage, no backend. Make responsive perfect desktop mobile.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://mbombela-transfer.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c326b557-77b0-48a2-9a5e-1671f21da7ca).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
