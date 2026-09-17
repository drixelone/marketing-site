# DrixelOne coming soon

A single-page React 19 / TypeScript / Vite site with the supplied GLB ribbon rendered by Three.js, React Three Fiber and Drei. No backend, tracking, signup or third-party runtime requests.

## Local development

Requires Node.js 22.12+ (Node 22 LTS recommended) and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. For the production bundle:

```sh
npm run build
npm run preview
```

The deployable output is `dist/`. Preview is a local verification server, not a production server.

## Assets and implementation

- `branding/` and `design/` contain the original supplied assets and reference.
- `public/assets/side-by-side_light-no-bg.png` is an unchanged copy of the supplied horizontal logo. CSS compensates for its transparent margins without stretching or recreating the artwork.
- The favicon uses the supplied light symbol.
- DM Sans 400/500/700 is self-hosted through `@fontsource/dm-sans`, including its font license in that package. The brand book permits using one family consistently. No Garet font was supplied.
- `public/assets/drixel-ribbon.glb` is an unchanged copy of `design/drixel-ribbon.glb` (about 1.46 MB), loaded locally with Drei's `useGLTF`. It includes the authored satin violet material, normal map and roughness map. The supplied geometry and textures are preserved; only the display orientation and studio lighting are configured in the scene. The previous procedural ribbon has been removed.
- `src/RibbonScene.tsx` contains a locally generated studio environment, ground shadow, bounded floating/rotation and damped pointer tilt. There are no remote environment or model dependencies.
- Motion stops for reduced-motion preferences. Rendering stops while the document is hidden. Mobile uses a smaller environment/shadow map and DPR capped at 1.25; desktop caps at 1.75. Touch devices retain gentle ambient movement without pointer tilt.
- `public/assets/ribbon-fallback.png` is a transparent export of the same 3D scene. It appears while the scene loads, if WebGL2 is unavailable, if model loading fails, or if the context is lost. Text and logo remain ordinary accessible HTML outside the decorative canvas.
- The copyright year is calculated at runtime.

## Browser verification

```sh
npx playwright install chromium
npm test
```

The tests cover desktop (1536×1024), mobile (390×844), narrow mobile (320×640), laptop (1366×768), short desktop (1280×600), landscape (844×390 and 667×375), both vertical and horizontal overflow, loaded assets, console errors, pointer response, reduced motion, page visibility and unavailable/lost WebGL. Screenshots are written to `test-results/`. The page uses the dynamic viewport height and allocates remaining space to the ribbon, so the complete composition fits on screen without scrolling.

Set `CHROME_PATH=/path/to/chrome` to use an installed Chrome instead of Playwright Chromium. Software WebGL flags allow reproducible rendering on machines without a GPU. Actual GPU rendering can vary slightly.

To regenerate the static fallback after changing the ribbon, start `npm run dev -- --port 4173` and run:

```sh
node scripts/capture.mjs
```

## Deploy to Vercel

The root `vercel.json` selects Vite, runs `npm ci` and `npm run build`, and serves `dist/`. No environment variables or additional Vercel plugin are required.

### Using the Vercel dashboard

1. Push this project to your Git repository.
2. In Vercel, choose **Add New → Project** and import that repository.
3. Set **Root Directory** to the folder containing this `package.json` (`marketing-site` if the repository contains its parent folders).
4. Confirm the **Vite** framework preset and Node.js **22.x**. The checked-in configuration supplies the build and output settings.
5. Click **Deploy** when you are ready to publish.

### Using the CLI

Run these yourself when ready to create a deployment:

```sh
npx vercel           # links the project and creates a preview deployment
npx vercel --prod    # publishes the production deployment
```

### Connect www.drixelone.com

After deploying, open the Vercel project's **Settings → Domains**, add `www.drixelone.com`, and follow the exact DNS records Vercel displays. Add `drixelone.com` too if you want the apex domain redirected to `www`. Preserve your existing email MX/TXT records. Vercel provisions HTTPS after domain verification.

The canonical and Open Graph URLs already use `https://www.drixelone.com/`. This is a single root page, so no catch-all SPA rewrite is needed. No Vercel deployment or DNS changes have been performed by the assistant.

References: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json).

## Technical references

Canvas resolution and render scheduling follow the [React Three Fiber Canvas API](https://r3f.docs.pmnd.rs/api/canvas). The satin surface uses [Three.js MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html).

## Verified result

Production build succeeded and all nine Playwright tests passed in local Chrome with software WebGL. Saved reference-comparison captures are in `design/previews/` (desktop, mobile and small mobile). Tests verify hidden-tab frames remain unchanged and resume afterward; reduced-motion frames remain stable while moving the cursor, allowing only negligible GPU color rounding. No browser console errors were reported in the layout checks.

Vite reports a size advisory for the lazy-loaded 3D chunk (about 255 KB gzip). The HTML/React page and static fallback load independently of that chunk. No deployment or DNS mutation was performed.

## Brand-book review

Reviewed the supplied 2026 brand book, particularly pages 5–10 and 14: the complete light-mode logo is preserved and uniformly scaled; the page uses white and pale lilac, ink `#151F28`, violet `#7B50FF`, and DM Sans 700 headings with 400 body copy. The supplied GLB's linear base color converts to the brand violet. Garet is named for reading text but no font file was supplied; DM Sans is used consistently as the book also permits. The page retains generous clear space and restrained effects.
