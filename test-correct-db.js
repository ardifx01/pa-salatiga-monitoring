const mysql = require('mysql2/promise');

async function testCorrectDb() {
  const dbConfig = {
    host: '167.172.88.142',
    user: 'generator_monitoring',
    password: '}Pqm;?_0bgg()mv!',
    database: 'generator_monitoring',
    port: 3306,
    connectTimeout: 60000,
  };

  console.log('Testing connection to generator_monitoring database...');
  
  try {
    console.log('\n🔄 Attempting to connect...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connection successful!');
    
    // List tables
    console.log('\n🔄 Listing tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('✅ Tables in generator_monitoring database:', tables);
    
    // Check if our required tables exist
    const tableNames = tables.map(t => Object.values(t)[0]);
    const requiredTables = ['monitoring_configs', 'monitoring_data', 'app_settings', 'admin_users'];
    
    console.log('\n🔄 Checking required tables...');
    for (const table of requiredTables) {
      if (tableNames.includes(table)) {
        console.log(`✅ Table "${table}" exists`);
        // Count records
        const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   Records: ${count[0].count}`);
      } else {
        console.log(`❌ Table "${table}" NOT found`);
      }
    }
    
    await connection.end();
    console.log('\n✅ Database test completed!');
    
  } catch (error) {
    console.error('\n❌ Connection failed:');
    console.error('Error:', error.message);
  }
}

testCorrectDb();