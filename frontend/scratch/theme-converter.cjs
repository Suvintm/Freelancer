const fs = require('fs');
const path = '../src/pages/YouTubeConnect.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/import logo from '\.\.\/assets\/darklogo\.png';/, "import logo from '../assets/lightlogo.png';");

content = content.replace(/className="h-screen w-full bg-black/g, 'className="h-screen w-full bg-white');
content = content.replace(/className="min-h-screen w-full bg-black/g, 'className="min-h-screen w-full bg-white');

content = content.replace(/bg-zinc-900\/15/g, 'bg-zinc-100/60');
content = content.replace(/bg-red-900\/\[0\.08\]/g, 'bg-red-500/[0.05]');

content = content.replace(/border-zinc-800/g, 'border-zinc-200');
content = content.replace(/bg-black\/40/g, 'bg-white/40');
content = content.replace(/text-zinc-400/g, 'text-zinc-600');
content = content.replace(/group-hover:text-white/g, 'group-hover:text-zinc-900');

content = content.replace(/text-white/g, 'text-zinc-900');
content = content.replace(/text-zinc-600">digital identity/g, 'text-zinc-500">digital identity');

content = content.replace(/!bg-zinc-900/g, '!bg-zinc-100');
content = content.replace(/hover:!bg-zinc-800/g, 'hover:!bg-zinc-200');
content = content.replace(/!text-zinc-400/g, '!text-zinc-600');

content = content.replace(/bg-zinc-900\/50/g, 'bg-zinc-50');
content = content.replace(/border-zinc-800\/60/g, 'border-zinc-200');
content = content.replace(/text-zinc-400 font-semibold/g, 'text-zinc-900 font-semibold');
content = content.replace(/text-zinc-500 leading-relaxed/g, 'text-zinc-600 leading-relaxed');

content = content.replace(/bg-zinc-900\/40/g, 'bg-zinc-50');
content = content.replace(/text-zinc-300/g, 'text-zinc-700');
content = content.replace(/bg-white\/5 border border-white\/10/g, 'bg-white border border-zinc-200 shadow-sm');

content = content.replace(/bg-zinc-800\/50/g, 'border-zinc-200');

content = content.replace(/bg-zinc-900\/60/g, 'bg-white shadow-sm');
content = content.replace(/bg-zinc-800 text-zinc-300 hover:bg-zinc-700/g, 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200');

content = content.replace(/bg-zinc-900\/80/g, 'bg-white');
content = content.replace(/border-zinc-700/g, 'border-zinc-200');
content = content.replace(/border-2 border-zinc-900/g, 'border-2 border-white');

content = content.replace(/bg-orange-950\/20/g, 'bg-orange-50');

content = content.replace(/bg-black\/80/g, 'bg-white/80');
content = content.replace(/border-zinc-900/g, 'border-zinc-200');
content = content.replace(/from-black/g, 'from-white');

content = content.replace(/bg-zinc-950\/60/g, 'bg-white/60');
content = content.replace(/fill-white/g, 'fill-zinc-900');

content = content.replace(/bg-zinc-950\/80/g, 'bg-white/80');
content = content.replace(/text-zinc-300 text-\[10px\]/g, 'text-zinc-700 text-[10px]');
content = content.replace(/bg-zinc-800 text-zinc-300 text-\[10px\]/g, 'bg-zinc-100 text-zinc-700 text-[10px]');

fs.writeFileSync(path, content, 'utf8');
console.log('Done replacement');
