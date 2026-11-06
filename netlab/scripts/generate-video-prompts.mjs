import fs from 'fs';
import path from 'path';

const root = import.meta.dirname ? path.resolve(import.meta.dirname, '..') : process.cwd();
const manifestPath = path.join(root, 'src', 'content', 'videos.json');
const outRoot = path.join(root, 'public', 'videos');

const TEMPLATE = `# TASK
Create a {durationSec}-second, 1920x1080, 30 fps practical lecture animation as a HyperFrames composition.
Topic: {title} (Computer Networks, Chapter {chapter}).
Output file name: {id}.mp4. Write source files only. Do not install packages. Keep all animation deterministic and timeline driven (no random values, no real-time clocks).

# TEACHING GOAL
A student must understand how this works and how it is implemented in real engineering within one viewing. It is a practical lecture, not a theory slide.
What to show: {concept}
Real-world implementation to show: {realWorld}
On-screen tools or commands: {tools}

# VISUAL STYLE
3D dark space (near-black #05070D to #0B1020 gradient), faint parallax starfield, floating dark metallic or glass network devices (PC, switch, router, firewall, server, cloud) with thin edge lines. Everything is dim by default. Only the element that is currently active glows softly (cyan #3BC9DB for control and signalling, amber #FFB020 for data and packets, green #2ED08A for success, red #FF5C5C for drops or errors), then fades back to normal when its job is done. Typography: JetBrains Mono, small, white at 80 percent opacity, labels of 1 to 4 words and live values only (IPs, ports, flags, sequence numbers, table entries). No paragraphs of text.

# STRUCTURE (scale to {durationSec} seconds)
1. 0 to 15 percent, SETUP: show the real situation (for example an office, a home, a data center) and the devices involved. Slow push-in.
2. 15 to 60 percent, HOW IT WORKS: animate the mechanism step by step with packets travelling between devices. Highlight each active device and show the packet header fields changing in a small floating panel. Orbit and dolly the camera to follow the action.
3. 60 to 90 percent, REAL IMPLEMENTATION: show how engineers actually configure or observe it: a router or switch CLI snippet typing in, a Wireshark style capture list with the relevant row highlighted, or a topology of the real deployment. Use realistic values.
4. 90 to 100 percent, RECAP: pull back to a wide shot, dim everything except the key result, show a one-line takeaway label, then fade to black with a small tag NETLAB at the end.

# CAMERA
Continuous flowing shot, no hard cuts. Mix push-in, orbit, whip-pan, macro close-up, top-down and pull-back with eased curves. Never static for more than 1.5 seconds. Subtle deterministic handheld drift. Glow peaks should sync with camera arrivals.

# TECHNICAL
Silent video (the owner adds voiceover later). Procedural geometry and text only, no external assets. Tunable values (colors, labels, timings, IPs) in a top-level config file. No API keys.
`;

function fill(video) {
  const values = {
    durationSec: video.durationSec,
    title: video.title,
    chapter: video.chapter,
    id: video.id,
    concept: video.concept,
    realWorld: video.realWorld,
    tools: video.tools || 'None. Show the topology and live values only.',
  };
  return TEMPLATE.replace(/\{(\w+)\}/g, (match, key) => (key in values ? String(values[key]) : match));
}

const { chapters, videos } = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const folderOf = new Map(chapters.map((c) => [c.number, c.folder]));
const titleOf = new Map(chapters.map((c) => [c.number, c.title]));

fs.mkdirSync(outRoot, { recursive: true });
for (const chapter of chapters) fs.mkdirSync(path.join(outRoot, chapter.folder), { recursive: true });

const rows = [
  '# NetLab video index',
  '',
  '| # | Chapter | Video ID | Title | Prompt file | Video file (add manually) | Status |',
  '| --- | --- | --- | --- | --- | --- | --- |',
];

let written = 0;
videos.forEach((video, i) => {
  const folder = folderOf.get(video.chapter);
  if (!folder) throw new Error(`Video ${video.id} points at unknown chapter ${video.chapter}`);
  fs.writeFileSync(path.join(outRoot, folder, `${video.id}.prompt.md`), fill(video), 'utf8');
  written += 1;
  const status = fs.existsSync(path.join(outRoot, folder, `${video.id}.mp4`)) ? 'Added' : 'Missing';
  rows.push(
    `| ${i + 1} | ${video.chapter}. ${titleOf.get(video.chapter)} | ${video.id} | ${video.title} | ${folder}/${video.id}.prompt.md | ${folder}/${video.id}.mp4 | ${status} |`,
  );
});

fs.writeFileSync(path.join(outRoot, 'VIDEO_INDEX.md'), `${rows.join('\n')}\n`, 'utf8');
console.log(`Wrote ${written} prompt files`);
