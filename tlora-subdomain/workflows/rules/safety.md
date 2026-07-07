# Generation Rules

- Only accept clear face images uploaded by the authenticated user.
- Store original uploads in a private Supabase Storage bucket.
- Do not expose service role keys to the browser.
- Log prompt, preset, OpenAI model, usage and status in `ai_requests`.
- Staff can review failed or flagged requests from `/admin-studio`.
