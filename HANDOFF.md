# DisasterReady — Handoff Context (continue from here)

## What this is
CM3070 University of London final-year project. A React Native (Expo SDK 57) +
Node.js disaster-preparedness mobile app. Personalises by age into 4 modes
(child / teen / adult 25-49 / senior 50+), plus region/country and accessibility.

- Frontend: /app  (Expo, plain JS, no TypeScript). Run: `cd app && npx expo start`
- Backend: /server (Node/Express, JSON storage in /server/data). Run: `cd server && node server.js`
- Backend needs /server/.env with ANTHROPIC_API_KEY (gitignored — copy it in, do not commit).

## IMPORTANT running notes
- Expo SDK 57. Metro was fragile during a 54->57 upgrade; it currently works. If Metro
  crashes with "Cannot read properties of undefined (transformFile)", the fix that worked
  was regenerating babel.config.js via `npx expo customize` and a clean `npm install`.
- app/services/api.js has a hardcoded BASE_URL with the Mac's LAN IP. It changes on WiFi
  reconnect and breaks login. Check `ipconfig getifaddr en0` and update that one line.

## What's built and working
- Auth: signup (age->experienceMode, region->country->hazards, accessibility, bcrypt), login.
- 4 age homes in app/screens/HomeScreen.js. Adult/senior recently restyled to a serious
  navy palette with a thin accent stripe; First Aid kept red/distinct.
- Kids: multi-hazard games (flood/earthquake/fire) — KitBuilder (4 levels: tap-pack, room
  search, detective, lane-runner) + Story Mode. Content in app/constants/hazardGames.js.
- Teens: Duolingo-style LearningPath + LessonScreen (multiple-choice/true-false/word-bank,
  hearts, XP, progress bar). Content in app/constants/lessonSchema.js and lessons.js.
  NOTE: the redesigned LessonScreen was not fully verified; also confirm teen home is NOT
  showing kids content (was suspected, likely just an account mix-up — teen = ages 13-24).
- Adults/Seniors: ResourceHub, AudioPlayer, and NEW First Aid guides
  (app/screens/FirstAidScreen.js + FirstAidGuideScreen.js, content in app/constants/firstAid.js).
  First Aid uses @expo/vector-icons (MaterialCommunityIcons), has real step-by-step content,
  a red "call first" box, a "watch the technique" video link per guide, and a disclaimer.
- Adaptive quiz engine, gamification (points/badges/ranks/streaks/tasks/lessons), scoped
  Claude chatbot, simulated alerts, leaderboard, dark/light ThemeContext (+ Settings screen).

## What we were about to do next (the task)
Build out ADULT + SENIOR disaster-prep CONTENT and a content-linked quiz, with polished
animations:
1. Write REAL detailed preparedness articles (what each disaster is, how to prepare,
   during, after) + an animated reader screen.
2. Expand the Resource Hub: articles + curated real videos + audio, organised by disaster.
3. A "Knowledge Check" quiz that tests the First Aid / resource content, awarding XP via
   the gamification system (backend route pattern: /gamification/lesson-complete etc.).
4. Nice animations/transitions (reanimated is installed) on the content screens.
Note: podcasts/audiobooks would be PLACEHOLDER audio only (real recordings can't be generated).

## Repo
GitHub: https://github.com/Dev-Joan/DisasteReady (main branch). Commit + push often.
Only work in ~/Downloads/DisasteReady-main (an older ~/Downloads/DisasteReady duplicate exists — ignore/delete it).

## Bigger-picture priority (supervisor feedback)
Grade is currently lost on the REPORT: unfilled placeholders, only one figure (needs many
screenshots now the app runs), inconsistent references, and NO human-participant evaluation
(the report promised a SUS questionnaire + adaptive-quiz accuracy tracking + chatbot
scoped-query tests). These matter more than new features.
