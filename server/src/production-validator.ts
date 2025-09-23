// Production environment validation
export function validateProductionEnvironment() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'SESSION_SECRET',
    'JWT_SECRET',
    'ADMIN_PASSWORD',
    'SUPERADMIN_PASSWORD',
    'CLIENT_URL',
    'NODE_ENV',
    'PORT'
  ];

  const missingVars: string[] = [];
  const weakVars: string[] = [];

  // Check for missing environment variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  // Check for weak passwords
  if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length < 12) {
    weakVars.push('ADMIN_PASSWORD (too short)');
  }

  if (process.env.SUPERADMIN_PASSWORD && process.env.SUPERADMIN_PASSWORD.length < 12) {
    weakVars.push('SUPERADMIN_PASSWORD (too short)');
  }

  // Check for weak session secret
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    weakVars.push('SESSION_SECRET (too short)');
  }

  // Check for development passwords in production
  if (process.env.NODE_ENV === 'production') {
    const devPasswords = ['admin', 'password', '123456'];
    
    if (devPasswords.includes(process.env.ADMIN_PASSWORD || '')) {
      weakVars.push('ADMIN_PASSWORD (using development password)');
    }
    
    if (devPasswords.includes(process.env.SUPERADMIN_PASSWORD || '')) {
      weakVars.push('SUPERADMIN_PASSWORD (using development password)');
    }
  }

  // Log validation results
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
  }

  if (weakVars.length > 0) {
    console.error('⚠️ Weak environment variables detected:', weakVars);
  }

  if (missingVars.length === 0 && weakVars.length === 0) {
    console.log('✅ All environment variables are properly configured');
  }

  return {
    isValid: missingVars.length === 0 && weakVars.length === 0,
    missingVars,
    weakVars
  };
}

// Security recommendations
export function getSecurityRecommendations() {
  const recommendations = [
    'Use strong, unique passwords (12+ characters)',
    'Enable HTTPS in production',
    'Regularly rotate session secrets',
    'Monitor admin access logs',
    'Use environment-specific database URLs',
    'Enable rate limiting',
    'Keep dependencies updated',
    'Use secure session cookies'
  ];

  return recommendations;
}
