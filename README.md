# Lifebot Dashboard (Multi-page Scaffold)

Each tab is a **separate page folder** with its own:
- `index.html`
- `style.css`
- `app.js`
- `data.json`

So you can edit any page independently.

## Run
Use a local server (required because pages fetch JSON):

```bash
python -m http.server 5500
```

Open:
http://localhost:5500/overview/index.html

## Notes
- No jQuery.
- External libraries are injected in JS:
  - Font Awesome
  - Tajawal font
  - (Overview only) ArcGIS JS API 4.26 + CSS
- Overview map basemap: `streets-vector`
