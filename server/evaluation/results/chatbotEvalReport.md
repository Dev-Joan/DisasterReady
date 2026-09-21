# Chatbot RAG Evaluation Report

Generated: 2026-09-18T12:06:00.894Z

LLM generation step: **not tested** — ANTHROPIC_API_KEY was missing or invalid, so only the retrieval half of the pipeline was evaluated. Reply/fallback columns are blank.

## Summary

| Metric | Result |
|---|---|
| In-domain: correct chunk retrieved in top-4 | 24/25 (96%) |
| In-domain: correct chunk retrieved at rank 1 | 24/25 (96%) |
| In-domain: average top-1 similarity score | 0.7187 |
| Out-of-scope: correctly found nothing relevant (score < 0.35) | 10/10 (100%) |
| In-scope-but-uncovered: correctly found nothing relevant (score < 0.35) | 1/6 (17%) |

## 1. In-domain test set (retrieval relevance)

Each question targets one specific corpus passage. "Hit" = that passage appeared in the top-4 retrieved chunks.

| # | Question | Expected chunk | Top retrieved chunk | Score | Rank of expected | Hit? |
|---|---|---|---|---|---|---|
| 1 | What's the recommended thing to do if the ground starts shaking while… | eq-01 | eq-01 — Drop, Cover, and Hold On | 0.7395 | 1 | ✅ |
| 2 | If an earthquake happens at night while I'm asleep, should I get up a… | eq-02 | eq-02 — If you are in bed when shakin… | 0.5954 | 1 | ✅ |
| 3 | What should I do if I'm driving and an earthquake starts? | eq-03 | eq-03 — Earthquakes and moving vehicl… | 0.7717 | 1 | ✅ |
| 4 | After the shaking from an earthquake stops, what's the first hazard I… | eq-04 | eq-02 — If you are in bed when shakin… | 0.682 | — | ❌ |
| 5 | Can more earthquakes happen right after the first one, and should I w… | eq-05 | eq-05 — Aftershocks | 0.6577 | 1 | ✅ |
| 6 | How can I earthquake-proof my furniture and shelves before anything h… | eq-06 | eq-06 — Securing your home before an … | 0.7136 | 1 | ✅ |
| 7 | Is it okay to drive my car through a flooded road if the water doesn'… | fl-01 | fl-01 — Never drive through floodwater | 0.6869 | 1 | ✅ |
| 8 | If officials tell me to evacuate because of an approaching flood, how… | fl-02 | fl-02 — Evacuating before a flood | 0.6697 | 1 | ✅ |
| 9 | Should I turn off my electricity before flood water reaches my house? | fl-03 | fl-03 — Preparing utilities before a … | 0.7946 | 1 | ✅ |
| 10 | What's the difference between a flash flood watch and a flash flood w… | fl-04 | fl-04 — Flash flood watches versus wa… | 0.8252 | 1 | ✅ |
| 11 | What should a family's flood preparedness plan include? | fl-05 | fl-05 — Household flood planning | 0.7014 | 1 | ✅ |
| 12 | How much space should I clear around my house to protect it from wild… | wf-01 | wf-01 — Creating defensible space aro… | 0.656 | 1 | ✅ |
| 13 | How do I know when it's time to leave my home because of an approachi… | wf-02 | wf-02 — When to evacuate for wildfire | 0.6595 | 1 | ✅ |
| 14 | How can I protect my indoor air quality during a wildfire smoke event? | wf-03 | wf-03 — Wildfire smoke and indoor air | 0.8138 | 1 | ✅ |
| 15 | Where's the safest place to go inside my house during a tornado warni… | storm-01 | storm-01 — Tornado warning: where to she… | 0.7957 | 1 | ✅ |
| 16 | What's the difference between a hurricane watch and a hurricane warni… | storm-02 | storm-02 — Hurricane preparation timeline | 0.7522 | 1 | ✅ |
| 17 | How do I know when it's safe to go back outside after a lightning sto… | storm-03 | storm-03 — Lightning safety: the 30-30 r… | 0.6721 | 1 | ✅ |
| 18 | What items should I include in a basic emergency preparedness kit? | gen-01 | gen-01 — Core emergency kit contents | 0.7363 | 1 | ✅ |
| 19 | How do I set up a family emergency communication plan if phone lines … | gen-02 | gen-02 — Building a family communicati… | 0.7717 | 1 | ✅ |
| 20 | What's a 'go-bag' and what should be inside it? | gen-03 | gen-03 — The go-bag concept | 0.6926 | 1 | ✅ |
| 21 | How do I include my pets in my emergency evacuation plan? | gen-04 | gen-04 — Planning for pets and service… | 0.8138 | 1 | ✅ |
| 22 | What should someone who uses a wheelchair or medical equipment plan f… | gen-05 | gen-05 — Planning for accessibility an… | 0.7183 | 1 | ✅ |
| 23 | How many evacuation routes should my household plan out in advance? | evac-01 | evac-01 — Choosing and knowing an evacu… | 0.7486 | 1 | ✅ |
| 24 | What should I grab first if I have to evacuate my home quickly? | evac-02 | evac-02 — What to bring when evacuating | 0.5633 | 1 | ✅ |
| 25 | How do I decide whether to evacuate or just stay inside during an eme… | evac-03 | evac-03 — Sheltering in place versus ev… | 0.7365 | 1 | ✅ |

## 2. Out-of-scope test set (fallback correctness)

Questions unrelated to disaster preparedness. Correct behaviour: retrieval finds nothing relevant, and the reply is the exact hard-coded out-of-scope refusal.

| # | Question | Top retrieved chunk | Score | Suppressed? |
|---|---|---|---|---|
| 1 | What is the capital of France? | wf-01 — Creating defensible spac… | 0.0778 | ✅ |
| 2 | Can you write me a Python function to reverse a string? | evac-01 — Choosing and knowing an … | 0.072 | ✅ |
| 3 | What's a good recipe for banana bread? | gen-01 — Core emergency kit conte… | 0.1087 | ✅ |
| 4 | Should I invest my savings in index funds or individual sto… | evac-03 — Sheltering in place vers… | 0.2061 | ✅ |
| 5 | I have a headache, what medication should I take? | eq-02 — If you are in bed when s… | 0.1312 | ✅ |
| 6 | My landlord won't return my deposit, what are my legal opti… | gen-04 — Planning for pets and se… | 0.1982 | ✅ |
| 7 | Tell me a joke. | eq-02 — If you are in bed when s… | 0.1069 | ✅ |
| 8 | Who won the most recent World Cup? | wf-01 — Creating defensible spac… | 0.0006 | ✅ |
| 9 | Can you write a short poem about the ocean? | fl-01 — Never drive through floo… | 0.1424 | ✅ |
| 10 | What's the best programming language to learn in 2026? | fl-01 — Never drive through floo… | 0.0696 | ✅ |

## 3. In-scope-but-uncovered test set (corpus-gap disclosure)

Questions that ARE about disaster preparedness but that no corpus passage answers. Correct behaviour: retrieval finds nothing relevant, and the reply says so WITHOUT using the hard out-of-scope refusal (that refusal is reserved for topic mismatch, not corpus gaps).

| # | Question | Top retrieved chunk | Score | Suppressed? |
|---|---|---|---|---|
| 1 | What should I do to prepare for a volcanic eruption? | eq-01 — Drop, Cover, and Hold On | 0.3414 | ✅ |
| 2 | How do I prepare my household for a pandemic or major disea… | fl-05 — Household flood planning | 0.4754 | ❌ |
| 3 | What flood insurance should I buy for my home? | fl-05 — Household flood planning | 0.5537 | ❌ |
| 4 | How do I purify water if I run out of bottled water during … | fl-03 — Preparing utilities befo… | 0.4269 | ❌ |
| 5 | What should I do to prepare for a nuclear power plant accid… | gen-01 — Core emergency kit conte… | 0.4438 | ❌ |
| 6 | How do I write a disaster response plan for my workplace? | fl-05 — Household flood planning | 0.5259 | ❌ |
