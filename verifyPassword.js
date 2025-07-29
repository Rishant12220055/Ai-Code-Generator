const bcrypt = require('bcryptjs');

const plainPassword = 'your_password'; // Replace with the actual password
const storedHash = '$2a$12$sPP/bWV6VysydDmu/VteYu3p/c0bXErYG12k4ElSAMIhYQ.cfcpqy';

bcrypt.compare(plainPassword, storedHash, (err, isMatch) => {
  if (err) {
    console.error('Error comparing passwords:', err);
  } else {
    console.log('Password match:', isMatch);
  }
});
