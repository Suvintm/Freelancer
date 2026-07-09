const fs = require('fs');

const replaceInFile = (file, regexes) => {
  let p = 'frontend/' + file;
  if(fs.existsSync(p)){
    let c = fs.readFileSync(p, 'utf8');
    regexes.forEach(r => { c = c.replace(r.reg, r.rep); });
    fs.writeFileSync(p, c);
  }
};

const rules = [
  { reg: /^import React(,\s*\{[^}]+\})?\s+from\s+['"]react['"];?\r?\n/gm, rep: (match, p1) => p1 ? 'import ' + p1.replace(/^,\s*/, '') + ' from \'react\';\n' : '' }
];

[
  'src/components/yt_creator/profile/DesktopProfile_Suvix/sections/Banner.tsx',
  'src/components/yt_creator/profile/DesktopProfile_Suvix/sections/ContentTabs.tsx',
  'src/components/yt_creator/profile/DesktopProfile_Suvix/sections/CreatorTools.tsx',
  'src/components/yt_creator/profile/MobileProfile_Suvix/sections/LinkedChannels.tsx',
  'src/components/yt_creator/profile/MobileProfile_Suvix/sections/MobileCreatorTools.tsx',
  'src/components/yt_creator/profile/MobileProfile_Suvix/sections/MobileIdentity.tsx',
  'src/components/yt_creator/profile/MobileProfile_Suvix/sections/MobileTopSplit.tsx'
].forEach(f => replaceInFile(f, rules));

// Fix formatCount in ProfileIdentity.tsx
let pIdent = 'frontend/src/components/yt_creator/profile/DesktopProfile_Suvix/sections/ProfileIdentity.tsx';
if(fs.existsSync(pIdent)){
  let c = fs.readFileSync(pIdent, 'utf8');
  c = c.replace(/const formatCount = [\s\S]*?};\n/m, '');
  c = c.replace(/^import React(,\s*\{[^}]+\})?\s+from\s+['"]react['"];?\r?\n/gm, (match, p1) => p1 ? 'import ' + p1.replace(/^,\s*/, '') + ' from \'react\';\n' : '');
  fs.writeFileSync(pIdent, c);
}
