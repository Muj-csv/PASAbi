# PASAbi — Colour Sweep (emergency apps)

Veronica · Step 9 (dimension: colour) · 2026-09-27
**Why it ran:** the team found v0 "lacking colour, a bit boring".
**Result:** the v1 colour rules in `DESIGN_BRIEF.md` §4.

## Findings

1. **Standards box colour in more than we thought.** ISO 22324 (colour-coded alerts) defines:
   - red = danger
   - yellow = caution
   - **green = safe**
   - black/purple = fatal danger
   - **blue = informational only**
   - **grey = no information available**

   It also asks for text, shape or position alongside every colour, never colour alone. ([HandWiki summary](https://handwiki.org/wiki/ISO_22324), [ISO 22324:2022](https://www.iso.org/standard/84559.html))

   **For PASAbi:**
   - Green on data would read as "safe", which breaks BR-017.
   - Purple would read as fatal.
   - Blue and grey are the only hues whose standard meaning matches what PASAbi says.
2. **PAGASA already owns yellow, orange and red** for rainfall warnings in the Philippines. ([Spot.ph](https://www.spot.ph/newsfeatures/culture/94414/rainfall-warning-color-meaning-pagasa-a4373-20210721))
3. **The 2026 AI colour default is purple plus cyan on dark navy, with glows.** ([AI Unchained, Mar 2026](https://www.ai-unchained.com/blog/ai-design/ai-picked-our-colors-theyre-generic))
4. **The human counter-trend has two parts:**
   - "dual aesthetics": minimal layouts with bold colour a person clearly chose
   - deliberately imperfect colour, such as low-ink or misregistered print

   ([Studio 2AM](https://studio2am.co/blogs/news/unfiltered-color-2026s-maximalist-color-palette-rebellion-against-the-algorithm))

   **For PASAbi:** Nothing-style minimal layout plus big coral and blue fields, with stamps as the imperfect ink.
5. **Nothing itself moved into colour in 2026.** The Phone (4a) came in blue, pink and yellow, so bold colour blocks don't break the reference. ([9to5Google](https://9to5google.com/2026/02/09/nothing-teases-a-colorful-phone-4a-launch/))
6. **Watch Duty and Genasys don't publish their palettes.** Their public pages describe functions, not colour, so nothing here copies them. ([Watch Duty flood launch](https://www.watchduty.org/blog/watch-duty-launches-flooding-nationwide), [Genasys](https://genasys.com/blog/designing-effective-public-safety-alert-systems/))

## What changed because of this

**Ballpen blue** is the second ink. It's the blue of logbook handwriting, and ISO's "informational" blue.

**Colour now works by mode:**
- the resident side is coral
- station mode has a blue band

**Colour appears in big fields, not specks:**
- changed rows get a light blue tint
- the "No reports" chip is grey (ISO "no information")
- stamp inks change by stage

**Data severity stays ink.** The full list is in `DESIGN_BRIEF.md` §4.
