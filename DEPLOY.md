# ShopEasy – Unit 5, Experiment 3: Deploy

The React app (front end) is a set of static files and can be hosted on GitHub Pages, Netlify and Vercel.
The API (`server/server.js`) is a Node program, so those three cannot run it. Host it once (Render / Railway) and point all three sites at it.

## 0) Host the API (once)
1. Render.com -> New -> Web Service -> pick this repo.
2. Build command `npm install`, start command `node server/server.js`.
3. Environment variables:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = any long random text
   - `ALLOWED_ORIGINS` = `https://YOUR_USER.github.io,https://YOUR-SITE.netlify.app,https://YOUR-SITE.vercel.app`
4. Copy the service URL, e.g. `https://shopeasy-api.onrender.com`. (No trailing slash.)
5. Free Render services sleep when idle (first request is slow) and forget new users/orders on restart. Fine for a lab.

## a) Production build (local check)
```powershell
npm install
npm test
npm run build        # creates the dist folder and lists file sizes
npm run preview      # http://localhost:4173
```

## b) GitHub Pages (automatic with the included workflow)
1. Upload the project files to the repo (see "Uploading" below). The file `.github/workflows/deploy.yml` must be included.
2. Repo -> Settings -> Pages -> **Source: GitHub Actions**. (If Source is "Deploy from a branch", GitHub shows your *source* `index.html`, which is a blank page / error. That is what happens when the app is not built.)
3. Repo -> Settings -> Secrets and variables -> Actions -> **Variables** -> New variable: `VITE_API_URL` = your API URL.
4. Repo -> Actions -> "Deploy to GitHub Pages" -> wait for the green tick (or push any change to re-run).
5. Open `https://YOUR_USER.github.io/REPO_NAME/`.

## c) Netlify
Add new site -> Import from GitHub -> pick the repo. `netlify.toml` already sets build command `npm run build` and publish folder `dist`.
Site configuration -> Environment variables -> `VITE_API_URL` = your API URL -> Deploys -> Trigger deploy.
(`public/_redirects` makes refreshing /cart etc. work.)

## d) Vercel
Add New -> Project -> import the repo (Vite is detected). Environment Variables -> `VITE_API_URL` = your API URL -> Deploy.
(`vercel.json` makes refreshing /cart etc. work.)

## e) Verify on each live URL
Sign up / log in -> browse products -> search and filter -> open a product -> add to cart -> change quantity -> refresh /cart (items stay) -> checkout and place an order.
DevTools -> Console / Network: no red errors, API calls return 200 (no CORS errors).

## f) Compare
| | GitHub Pages | Netlify | Vercel |
|---|---|---|---|
| Setup steps / time | | | |
| Build time | | | |
| Extra config needed | base path + 404.html | `_redirects` | `vercel.json` |
| Refresh on /cart works | | | |
| PWA / service worker | | | |
| Lighthouse score | | | |
| Free-tier limits, custom domain, HTTPS | | | |

## Uploading to GitHub without git
GitHub's web uploader accepts about 100 files at a time, and this project has slightly more.
Unzip, open the repo -> Add file -> Upload files, then upload in two rounds: first the `src` folder, then everything else (including the hidden `.github` folder; turn on "Hidden items" in Windows Explorer to see it). Commit each round.
Or with git, inside the unzipped folder:
```powershell
git init
git add .
git commit -m "ShopEasy"
git branch -M main
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main --force
```
