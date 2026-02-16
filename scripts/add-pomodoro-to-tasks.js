#!/usr/bin/env node

// Script para adicionar PomodoroTimer à página de tasks

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app/tasks/page.js');

let content = fs.readFileSync(filePath, 'utf8');

// Verificar se já tem PomodoroTimer
if (content.includes('PomodoroTimer')) {
  console.log('✓ PomodoroTimer já está na página de tasks');
  process.exit(0);
}

// Adicionar import
content = content.replace(
  /import \{ useToast \} from '..\/hooks\/useToast';/,
  `import { useToast } from '../hooks/useToast';
import TopNavigation from '../components/TopNavigation';
import PomodoroTimer from '../components/PomodoroTimer';`
);

// Encontrar onde adicionar o PomodoroTimer (após o ProgressBar)
const progressBarEndIndex = content.indexOf('                  color="gradient"');
if (progressBarEndIndex !== -1) {
  const afterProgressBar = content.indexOf('              </div>', progressBarEndIndex);
  if (afterProgressBar !== -1) {
    const insertPosition = content.indexOf('\n            }', afterProgressBar);
    
    if (insertPosition !== -1) {
      const pomodoroCode = `
            {/* Pomodoro Timer */}
            <div style={{ marginBottom: '2rem' }}>
              <PomodoroTimer onSessionComplete={(session) => {
                console.log('Pomodoro session completed:', session);
              }} />
            </div>
`;
      content = content.slice(0, insertPosition) + pomodoroCode + content.slice(insertPosition);
    }
  }
}

fs.writeFileSync(filePath, content);
console.log('✓ PomodoroTimer adicionado à página de tasks');
