# LinisGo

**Linis on the Go!** — A mobile-first home-cleaning service website created as a school project.

Developed for the **School of Computing, Holy Angel University**, for **6INTROWEB / 6WEBCS**, LinisGo follows the group's website proposal and Figma mockups. It demonstrates how residents of **Fiesta Communities, Xevera Subdivision, and Tabun, Mabalacat City** could explore services, compare prices, and prepare a cleaning request.

> **School-project demo:** Booking, login, and payment-related screens are frontend demonstrations. The website does not submit appointments, authenticate users, or process payments.

## Purpose and audience

LinisGo is designed for busy professionals, homeowners, families, tenants, and renters. The project aims to make cleaning services and pricing easy to understand, guide users through choosing services and add-ons, and provide readable layouts for mobile, tablet, and desktop screens.

## Main pages and features

| Page | Main features |
| --- | --- |
| [Home](index.html) | Service highlights, first-clean offer, before/after image comparison, and an interactive booking guide. |
| [Services](services.html) | Basic Clean, Deep Clean, Ironing, and All-in-One options; service filters, preparation checklist, and FAQs. |
| [Pricing](pricing.html) | Estimates based on home size, cleaning type, and extras; estimated duration and downpayment breakdown; selections carried into Booking. |
| [Booking](book.html) | Required-field validation, cleaning-plan estimates, and an editable request summary. |
| [Contact](contact.html) | Inquiry message drafts that users can copy, plus a link to the owner-provided Facebook profile. |

Shared features include responsive navigation, a mobile booking bar, and a demonstration Client Login dialog.

## Tech stack

- **HTML5** for page structure and forms.
- **CSS3** for styling, responsive layouts, and animations.
- **Vanilla JavaScript** for interactive features, pricing calculations, and form validation.
- **Google Fonts:** Outfit for headings and Plus Jakarta Sans for body text.
- **Figma** for the initial layouts and visual references.

The project uses plain HTML, CSS, and JavaScript, with no framework, package installation, or build step. Page files are in the project root, styles are in `styles.css` and `css/`, interactions are in `js/main.js`, and images are in `images/`.

## How to run locally

1. Download or clone the project and keep its folder structure intact.
2. Open `index.html` in a browser to explore the website.

For more consistent browser behavior, use a local server. With Python 3 installed, open a terminal in the project folder and run:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

On Windows, use `py` instead of `python3`. Open [http://127.0.0.1:8765](http://127.0.0.1:8765) and press **Ctrl+C** in the terminal when finished.

Enable JavaScript for interactive features. Internet access is needed for Google Fonts and external Facebook links; fallback fonts are included. If copying a message is blocked by the browser, copy the text manually. Use fictional personal details when trying the booking form.

## Design and accessibility

The design preserves the proposal's brand palette:

| Color | Hex | Main use |
| --- | --- | --- |
| Deep Teal | `#12433d` | Navigation and primary headings |
| Teal | `#1c6259` | Supporting interactive elements |
| Amber | `#e8a33d` | Primary calls to action |
| Cream | `#f7f4ec` | Page backgrounds |
| Ink | `#16241f` | Body text |

Accessibility features include a skip link, labeled forms and associated error messages, keyboard-operable booking steps and image slider, dialog focus handling, reduced-motion support, and a pause button for the rotating headline. These features do not represent formal accessibility certification. Before/after images are illustrative, not documented client results.

## Demo limitations

- **Booking:** Requests are reviewed in the browser only. There is no submission, email delivery, appointment storage, or availability system.
- **Login and referrals:** Sign-in fields are disabled; referral codes are not saved, validated, or redeemed.
- **Payments:** Prices and downpayment amounts are demonstration calculations. No payment is collected or verified.
- **Contact:** Phone numbers are placeholders. Facebook links open the supplied profile; messages must be copied and sent manually.
- **Data:** There is no backend or database. The site's code does not intentionally save form entries or message drafts; only the mobile booking-bar preference is remembered within the browser tab's session.

## Project team and references

**Section:** CYB-202

- John Paul Adriane Canlas
- Earl Joseph Cunanan
- Timothy Jyrus Tique

**Instructor:** Raquel B. Rivera

Based on **“LinisGo — Linis on the Go!”**, the August 2026 website proposal and Figma mockup submitted for the midterm and final output in **6INTROWEB** at Holy Angel University.

- **Proposal document:** `Canlas,Cunanan,Tique-Website-Proposal-Figma-Mockup.docx` (provided separately).
- **Design reference:** [LinisGo on Figma](https://www.figma.com/design/Mr5wPBOyriSxJUZF0tSAjw/LinisGo?node-id=0-1).

## Demo login and registration

Open `login.html` or choose Client Login. Use `register.html` to try registration. These pages use plain HTML, `css/auth.css`, and `js/auth.js`. Required fields, email format, password length, and matching registration passwords are checked. Success shows an alert and clears the form. No account is created, authenticated, or saved; no form data is sent to a server. Use sample details.
