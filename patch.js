const fs = require('fs');
const file = 'd:/Projetos END/GB/frontend/src/lib/supabase/database.ts';
let content = fs.readFileSync(file, 'utf8');

// For updates: .update(XYZ) -> .update({ updatedAt: new Date().toISOString(), ...XYZ })
content = content.replace(/\.update\(([a-zA-Z0-9_]+)\)/g, '.update({ updatedAt: new Date().toISOString(), ...$1 })');

// For inserts: .insert({ id: crypto.randomUUID(), ...XYZ }) -> .insert({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...XYZ })
content = content.replace(/\.insert\(\{\s*id:\s*crypto\.randomUUID\(\),\s*\.\.\.([a-zA-Z0-9_]+)\s*\}\)/g, '.insert({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...$1 })');

// Handle specific complex insert inside createCostWithItems
content = content.replace(/\.insert\(\{\n\s*id:\s*crypto\.randomUUID\(\),\n\s*\.\.\.cost,\n\s*culturaId/g, '.insert({\n    id: crypto.randomUUID(),\n    createdAt: new Date().toISOString(),\n    updatedAt: new Date().toISOString(),\n    ...cost,\n    culturaId');

fs.writeFileSync(file, content);
console.log('Patch complete!');
