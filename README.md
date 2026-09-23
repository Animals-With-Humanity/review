# Core Team Member of the Month

A small Firebase-ready web app for reviewing every core-team member.

## Features
- Reviewer name + email required.
- Review every core member one-by-one.
- Quick ratings with "Don't know them well".
- Traits, examples, suggestions and future potential.
- Touch-friendly animal drawing pad with colors, eraser and brush size.
- Overall rating.
- Organizer member management.
- Close/open review period.
- After closing, community view shows reviews without reviewer names.
- Emoji / +1 reactions are stored separately.
- Deterministic review/reaction IDs are used to discourage duplicates.

## Firebase setup
1. Create a Firebase project.
2. Add a Web App.
3. Enable Firestore Database.
4. Enable Authentication -> Sign-in method -> Anonymous.
5. Paste the Web App config into `app.js` as `firebaseConfig`.
6. Publish `firestore.rules`.
7. Host the three files (`index.html`, `style.css`, `app.js`) on Vercel/Firebase Hosting/etc.

## Important production note
This starter intentionally keeps the organizer UI simple. For a real NGO deployment, protect organizer actions with Firebase Authentication and stricter Firestore rules. Client-side checks alone cannot guarantee "one person = one review" against a malicious user.

## Suggested monthly workflow
1. Organizer adds the month's core members.
2. Open reviews.
3. Everyone enters their name/email and reviews each member.
4. Organizer closes reviews.
5. Community page opens.
6. Everyone reads anonymous answers and reacts.
7. Use rating averages + reaction counts as supporting signals, not as the only measure.
