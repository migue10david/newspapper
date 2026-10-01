import { readFileSync } from 'node:fs';

const content = readFileSync('AGENTS.md', 'utf8');
const errors = [];
if (!content.includes('newspapper/')) errors.push('AGENTS.md debe mencionar newspapper/');
if (!content.includes('newspapper-frontend/')) errors.push('AGENTS.md debe mencionar newspapper-frontend/');
if (content.includes('`frontend/`') || content.includes('`backend/`'))
  errors.push('AGENTS.md sigue mencionando `frontend/`/`backend/` como carpetas');

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('agents docs check ok');
