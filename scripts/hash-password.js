const bcrypt = require('bcryptjs');

async function hashPassword() {
  const password = 'admin123';
  const saltRounds = 12;
  
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('Password:', password);
    console.log('Hashed Password:', hashedPassword);
    
    // Test verification
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log('Verification test:', isValid);
  } catch (error) {
    console.error('Error:', error);
  }
}

hashPassword();