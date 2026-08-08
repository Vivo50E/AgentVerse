# Knowledge Base — X API (only for opt-in "share report card")

> NOTE: For *reading* X data we use Grok's native `x_search()` — no X API needed.
> The X API is ONLY for the optional "share your battle report to X" feature.

## Post a tweet
- **Endpoint:** `POST https://api.x.com/2/tweets`
- **Auth:** OAuth 2.0 user context (PKCE)
- **Scopes:** `tweet.write`, `tweet.read`, `users.read`
- **Body (text):**
```json
{ "text": "..." }
```
- **With media (the report card image):**
```json
{ "text": "I just watched my AI agent slay a bug 🐉  #AgentVerse", "media": { "media_ids": ["<id>"] } }
```
- Media must be uploaded first to get `media_ids` (1–4).
- Response: 201 with post id + text.
- Quote-post needs Enterprise — ignore.

## Hackathon note
- OAuth + media upload is fiddly. For the 12h build, a **v0 fallback** is: generate the report card image, let the user download it, and open a pre-filled web intent (`https://x.com/intent/tweet?text=...`) — no OAuth needed. Wire the real API post-hackathon.
