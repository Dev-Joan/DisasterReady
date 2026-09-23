# Lottie asset sources

All files here are free and permissively licensed. Fetched via `npm pack`
(reading the actual published package contents) rather than scraping
LottieFiles' website, which blocks automated access.

| File | Source | License |
|---|---|---|
| `loading.json` | [`react-native-lottie-loader`](https://www.npmjs.com/package/react-native-lottie-loader) v1.0.0 | MIT |
| `celebration-star.json` | [`react-useanimations`](https://www.npmjs.com/package/react-useanimations) v2.10.0 (`star` icon) | MIT |
| `empty-folder.json` | [`react-useanimations`](https://www.npmjs.com/package/react-useanimations) v2.10.0 (`folder` icon) | MIT |
| `weather/*.json` (10 files) | [`@meteocons/lottie`](https://www.npmjs.com/package/@meteocons/lottie) v0.1.0, `fill` style, by Bas Milius ([basmilius/meteocons](https://github.com/basmilius/meteocons)) | MIT |

## Note on the celebration animation

`react-useanimations` icons are small (32x32) UI micro-interactions, not
full celebration scenes — there was no free, MIT-licensed "confetti burst"
or "trophy" Lottie file I could confirm and verify (LottieFiles' own
catalog blocks scraping, and every celebration-themed GitHub repo found
either had no license or didn't actually contain the file). `star.json` is
used as the celebratory glyph, layered on top of the app's existing
`components/Celebration.js` confetti burst (custom Reanimated, already
built and tested) for visual weight — this is a deliberate combination,
not a compromise being passed off as something it isn't.

## Weather icon mapping

`weatherService.js`'s WMO weather codes map onto these 10 icons —
see `WEATHER_LOTTIE_MAP` in `app/constants/weatherLottie.js`.
