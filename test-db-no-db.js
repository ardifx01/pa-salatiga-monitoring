const mysql = require('mysql2/promise');

async function testConnectionNoDb() {
  const dbConfig = {
    host: '167.172.88.142',
    user: 'generator_monitoring',
    password: '}Pqm;?_0bgg()mv!',
    port: 3306,
    connectTimeout: 60000,
  };

  console.log('Testing database connection without database selection...');
  
  try {
    console.log('\n🔄 Attempting to connect...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connection successful!');
    
    // List available databases
    console.log('\n🔄 Listing available databases...');
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('✅ Available databases:', databases);
    
    // Check user permissions
    console.log('\n🔄 Checking user permissions...');
    const [grants] = await connection.execute('SHOW GRANTS');
    console.log('✅ User grants:', grants);
    
    await connection.end();
    console.log('\n✅ Connection test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }
}

testConnectionNoDb();