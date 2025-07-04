const { exec } = require('child_process');

console.log('🔄 Quick Server Restart Script');
console.log('===============================');

// Kill any existing Node processes (if any)
console.log('🛑 Stopping any existing server processes...');

exec('taskkill /F /IM node.exe', (error) => {
  // Ignore errors as there might not be any running processes
  console.log('🔄 Process cleanup completed');
  
  // Start the server
  console.log('🚀 Starting optimized server...');
  
  const server = exec('npm run dev', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Server start error:', error);
      return;
    }
  });
  
  server.stdout.on('data', (data) => {
    console.log(data.toString());
  });
  
  server.stderr.on('data', (data) => {
    console.error(data.toString());
  });
  
  console.log('✅ Server restart initiated');
  console.log('📊 Monitor the logs above for performance improvements');
}); 