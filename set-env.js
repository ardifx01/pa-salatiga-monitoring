const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const envVars = {
  'DB_HOST': '167.172.88.142',
  'DB_USER': 'generator_monitoring',
  'DB_PASSWORD': '}Pqm;?_0bgg()mv!',
  'DB_NAME': 'monitoring_db',
  'DB_PORT': '3306',
  'NEXTAUTH_SECRET': 'pa-salatiga-monitoring-secret-key-2025'
};

async function setEnvVars() {
  for (const [key, value] of Object.entries(envVars)) {
    try {
      console.log(`Setting ${key}...`);
      // Create a temporary file with the value
      const fs = require('fs');
      fs.writeFileSync('temp_env_value.txt', value);
      
      const command = `vercel env add ${key} production < temp_env_value.txt`;
      await execAsync(command);
      console.log(`✅ ${key} set successfully`);
      
      // Clean up temp file
      fs.unlinkSync('temp_env_value.txt');
    } catch (error) {
      console.error(`❌ Error setting ${key}:`, error.message);
    }
  }
}

setEnvVars();