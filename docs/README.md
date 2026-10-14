# Moventra Logistics — GitHub Pages Website

**Parent company concept:** Moventra Logistics & Delivery  
**Technology feature:** LogiGenAI — a prototype delivery-exception recovery assistant.

This site is designed for the ITBT Live Class Exercise: Home, About, Services, an operations dashboard with six KPIs and a chart, Contact/Enquiry, useful hyperlinks, shipment search, and an interactive exception recovery feature.

## Prototype data disclosures
- Shipment records, route illustration, dashboard metrics, service prices and exception responses are illustrative classroom examples.
- Shipment search is not connected to a carrier or real-time location feed.
- LogiGenAI on this GitHub Pages version uses rule-based sample responses and does not call a live AI model.
- The enquiry form validates inputs in the browser but does not transmit or store submissions.
- Moventra is a fictional academic concept brand. Replace demo contact details before using the site for a real business.

## Deploy from the existing repository
1. Copy this `docs/` folder into the root of the existing GitHub repository without overwriting the Flask app files.
2. Commit and push the new files.
3. In GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main` and folder `/docs`, then save.
6. Wait for the deployment and use the URL shown on the Pages settings screen.

The existing Flask app can remain hosted on Render. This GitHub Pages version is static HTML/CSS/JavaScript and does not require a Python backend.
