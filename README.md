# Bigex Cars

A futuristic, mobile-first car marketplace for discovering, comparing and selling vehicles.

## Current build
- Cinematic dark/glass marketplace UI
- Supabase-backed approved listings
- Search across vehicle name, type, fuel, location, transmission and seller
- Quick category filters plus advanced price/year/location/fuel/transmission filters
- Persistent local shortlist/favorites
- Compare up to 4 vehicles with direct listing links
- Dedicated vehicle detail pages with seller contact actions
- Seller listing form with image preview and pending/approved moderation workflow
- Supabase-backed authentication and administrator control center
- Server-side Bigex AI car matching through a Supabase Edge Function
- Responsive mobile navigation and marketplace layouts
- Loading, empty, retry and broken-image states

## Architecture
The frontend is deployed as a static site through GitHub Pages. Supabase provides authentication, the listings database, row-level security and the server-side Bigex AI function.

The browser only uses the public Supabase client key. The OpenAI API key belongs in the Supabase Edge Function environment and must never be committed to the repository.

## Database setup
Run `supabase/schema.sql` in the Supabase SQL editor. It includes the listing fields used by the current seller workflow, including transmission and seller contact information.

## Roadmap
1. Cloud-backed favorites per account
2. Real seller profiles and image storage
3. Buyer/seller messaging
4. Saved searches and alerts
5. Location-aware discovery
6. Production security and abuse hardening
7. Better vehicle image galleries and listing analytics
8. Marketplace trust features such as reporting and verification
