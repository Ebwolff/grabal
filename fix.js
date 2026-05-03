const fs = require('fs');
let content = fs.readFileSync('d:/Projetos END/GB/frontend/src/lib/supabase/database.ts', 'utf8');

// Replace standard inserts
content = content.replace(/\.insert\(([a-zA-Z0-9_]+)\)/g, '.insert({ id: crypto.randomUUID(), ...$1 })');

// Handle specific complex insert inside createCostWithItems
content = content.replace(/\.insert\(\{\n\s+\.\.\.cost,\n\s+culturaId/g, '.insert({\n    id: crypto.randomUUID(),\n    ...cost,\n    culturaId');

fs.writeFileSync('d:/Projetos END/GB/frontend/src/lib/supabase/database.ts', content);
console.log('Done!');
