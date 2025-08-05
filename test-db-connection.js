const mysql = require('mysql2/promise');

async function testConnection() {
  const dbConfig = {
    host: '167.172.88.142',
    user: 'generator_monitoring',
    password: '}Pqm;?_0bgg()mv!',
    database: 'monitoring_db',
    port: 3306,
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
  };

  console.log('Testing database connection...');
  console.log('Host:', dbConfig.host);
  console.log('User:', dbConfig.user);
  console.log('Database:', dbConfig.database);
  console.log('Port:', dbConfig.port);
  
  try {
    console.log('\n🔄 Attempting to connect...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connection successful!');
    
    // Test query
    console.log('\n🔄 Testing query...');
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query successful:', rows);
    
    // Test database access
    console.log('\n🔄 Testing database access...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('✅ Tables in database:', tables);
    
    // Test specific table
    console.log('\n🔄 Testing monitoring_configs table...');
    const [configs] = await connection.execute('SELECT COUNT(*) as count FROM monitoring_configs');
    console.log('✅ Monitoring configs count:', configs);
    
    await connection.end();
    console.log('\n✅ Connection test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('SQL State:', error.sqlState);
    console.error('Error number:', error.errno);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 This is an access denied error. Possible causes:');
      console.log('1. Wrong username or password');
      console.log('2. User does not have permission to access the database');
      console.log('3. User is not allowed to connect from this IP address');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Connection refused. Possible causes:');
      console.log('1. MySQL server is not running');
      console.log('2. Wrong host or port');
      console.log('3. Firewall blocking the connection');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('\n💡 Connection timeout. Possible causes:');
      console.log('1. Network connectivity issues');
      console.log('2. MySQL server is too slow to respond');
      console.log('3. Firewall or network configuration blocking connection');
    }
  }
}

testConnection();