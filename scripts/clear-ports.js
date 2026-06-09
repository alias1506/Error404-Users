const { execSync } = require('child_process');

const ports = [3000, 5005];

function killPort(port) {
  try {
    console.log(`🔍 Checking port ${port}...`);
    let pids = [];
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' }).trim();
      if (output) {
        const lines = output.split('\n');
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          // The PID is the last element in the netstat -ano output
          const pid = parts[parts.length - 1];
          if (pid && !isNaN(pid) && pid !== '0' && !pids.includes(pid)) {
            pids.push(pid);
          }
        }
      }
    } else {
      // Unix-based systems
      const output = execSync(`lsof -i tcp:${port} -t`, { encoding: 'utf8' }).trim();
      if (output) {
        pids = output.split('\n').map(p => p.trim()).filter(Boolean);
      }
    }

    if (pids.length > 0) {
      console.log(`⚠️ Found active process(es) on port ${port}: PIDs ${pids.join(', ')}. Killing...`);
      for (const pid of pids) {
        try {
          if (process.platform === 'win32') {
            execSync(`taskkill /F /PID ${pid}`);
          } else {
            execSync(`kill -9 ${pid}`);
          }
          console.log(`💥 Successfully killed process ${pid}`);
        } catch (killError) {
          console.error(`❌ Failed to kill process ${pid}:`, killError.message);
        }
      }
    } else {
      console.log(`✅ No active processes found on port ${port}.`);
    }
  } catch (error) {
    // If findstr or lsof finds nothing, execSync throws an error, which means the port is already free.
    console.log(`✨ Port ${port} is clear.`);
  }
}

console.log('🧹 Clearing ports 3000 and 5005...');
ports.forEach(killPort);
console.log('🚀 Ports cleared successfully!\n');
