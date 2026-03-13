const { execSync } = require('child_process');
const path = 'C:\\repo\\repo-guard';

try {
  console.log('Creating branch...');
  execSync('git checkout -b feature/demo-analysis', { cwd: path, stdio: 'inherit' });
  
  console.log('Adding README.md...');
  execSync('git add README.md', { cwd: path, stdio: 'inherit' });
  
  console.log('Committing...');
  execSync('git commit -m "chore: add demo comment to README"', { cwd: path, stdio: 'inherit' });
  
  console.log('Pushing...');
  execSync('git push -u origin feature/demo-analysis', { cwd: path, stdio: 'inherit' });
  
  console.log('Done!');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
