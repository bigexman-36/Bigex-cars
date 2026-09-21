# Bigex Cars

A futuristic, mobile-first car marketplace prototype.

## Current build
- Cinematic dark/glass marketplace UI
- Search and category filters
- Persistent local favorites
- Compare selection (up to 4 cars)
- Seller listing form with pending/approved workflow
- Administrator control center for local listing moderation
- Supabase schema and browser configuration prepared for cloud integration
- Admin role logic prepared for Supabase-backed authentication

## Current limitation
The GitHub Pages build is still a static frontend. Seller listings, favorites and moderation currently use browser localStorage, so they are not shared between different devices/users.

## Supabase next step
Create a Supabase project, run `supabase/schema.sql`, then provide the public project URL and anon key through `window.BIGEX_SUPABASE_URL` and `window.BIGEX_SUPABASE_ANON_KEY`. Do not expose a service-role key in the frontend.

## Roadmap
1. Connect marketplace listings to Supabase
2. Replace demo sign-in with Supabase Auth
3. Persist favorites per account
4. Add real seller profiles and image storage
5. Add cloud-wide admin moderation
6. Add buyer/seller messaging
7. Add real comparison details and vehicle pages
8. Connect AI matching to a server-side AI endpoint
9. Add location-aware discovery
10. Production hardening and deployment
