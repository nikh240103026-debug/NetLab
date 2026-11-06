# NetLab

Computer Networks learning platform for engineering students: notes, diagrams, labs, tests, calculators and an AI tutor.

Copy .env.example to .env.local and set GEMINI_API_KEY, GEMINI_MODEL and AUTH_SECRET.

npm install
npm run dev

Video prompts: node scripts/generate-video-prompts.mjs writes them to public/videos/.
Add a video by placing <id>.mp4 next to its prompt file. No code change is needed.
With next start, files added after next build need a rebuild before they are served.

User accounts are stored in data/users.json, so this suits local or single-instance use.
