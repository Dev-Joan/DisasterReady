# DisasterReady

A gamified, personalised mobile application for disaster preparedness, built for the
CM3070 Computer Science Final Project (CM3050 Mobile Development template).

DisasterReady reframes preparedness as an ongoing, adaptive learning process. It
provides four age-based experiences (child, teen, adult, senior) on a shared backend,
with an adaptive quiz, a grounded chatbot, and a live weather advisory pipeline.

## Key features
- **Adaptive quiz** driven by a Bayesian Knowledge Tracing (BKT) engine
- **Retrieval-Augmented Generation (RAG)** chatbot grounded in a vetted corpus
- **Two-layer weather advisory pipeline** (official warnings + forecast-derived advisories)
- **Four age-adaptive interface modes** with a rule-based accessibility engine
- **Gamification**: points, badges, ranks, streaks
- **Normalised SQLite database** (16 tables) with schema-level integrity

## Tech stack
- **Frontend:** React Native + Expo (JavaScript)
- **Backend:** Node.js + Express
- **Database:** SQLite (better-sqlite3)
- **External services:** Open-Meteo, US NWS / MeteoAlarm / GDACS / USGS, Anthropic Claude API

## Repository structure
- `app/` — React Native (Expo) mobile client
- `server/` — Node.js backend, services, database schema, and evaluation scripts

## Running the project

### Backend

cd server
npm install
cp .env.example .env # then add your Anthropic API key to .env
node server.js

The server runs on port 3000.

### Frontend

cd app
npm install
npx expo start

Set the API base URL in `app/services/api.js` to your machine's LAN IP, then open the
app in Expo Go or a simulator.

## Configuration
The chatbot requires an Anthropic API key, set in `server/.env` (see `.env.example`).
The key is never committed to the repository. The app runs without it; only the
chatbot feature is unavailable if no key is present.

## Evaluation
- BKT engine simulation: `node server/services/bktSimulation.js`
- RAG retrieval evaluation report: `server/evaluation/results/`

## Author
Jeanne d'Arc Tannous — BSc Computer Science, University of London

## Note on AI assistance
AI tools were used during development and are declared in full in the project report
(Appendix G).
