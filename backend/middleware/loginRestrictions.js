const geoip = require('geoip-lite');

const checkLoginRestrictions = (user, req) => {
  const errors = [];

  // Check work days restriction
  if (user.allowedWorkDays && Array.isArray(user.allowedWorkDays) && user.allowedWorkDays.length > 0) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];

    if (!user.allowedWorkDays.includes(today)) {
      errors.push(`Access denied: You are not allowed to login on ${today}`);
    }
  }

  // Check IP address restriction
  if (user.allowedIPAddresses && Array.isArray(user.allowedIPAddresses) && user.allowedIPAddresses.length > 0) {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const cleanIP = clientIP.replace('::ffff:', '');

    if (!user.allowedIPAddresses.includes(cleanIP) && !user.allowedIPAddresses.includes('*')) {
      errors.push(`Access denied: Your IP address (${cleanIP}) is not authorized`);
    }
  }

  // Check country restriction
  if (user.allowedCountries && Array.isArray(user.allowedCountries) && user.allowedCountries.length > 0) {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const cleanIP = clientIP.replace('::ffff:', '');

    // Skip localhost/private IPs
    if (cleanIP !== '127.0.0.1' && cleanIP !== 'localhost' && !cleanIP.startsWith('192.168.')) {
      const geo = geoip.lookup(cleanIP);

      if (geo && !user.allowedCountries.includes(geo.country)) {
        errors.push(`Access denied: Access from ${geo.country} is not authorized`);
      }
    }
  }

  return {
    allowed: errors.length === 0,
    errors
  };
};

module.exports = { checkLoginRestrictions };
