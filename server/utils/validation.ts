const VALID_AVATAR_IDS = new Set([
  'avatar1','avatar2','avatar3','avatar4','avatar5',
  'avatar6','avatar7','avatar8','avatar9','avatar10',
  'avatar11','avatar12','avatar13','avatar14',
]);

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateRegistration(input: {
  username?: unknown;
  email?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
}) {
  const errors: string[] = [];
  const username = typeof input.username === 'string' ? input.username.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const password = typeof input.password === 'string' ? input.password : '';
  const confirmPassword = typeof input.confirmPassword === 'string' ? input.confirmPassword : '';

  if (!username) errors.push('Username is required.');
  if (username.length > 50) errors.push('Username must be 50 characters or less.');
  if (!email || !isValidEmail(email)) errors.push('Enter a valid email address.');
  if (password.length < 8) errors.push('Password must be at least 8 characters.');
  if (password !== confirmPassword) errors.push('Passwords do not match.');

  return { errors, values: { username, email, password } };
}

export function validateLogin(input: { email?: unknown; password?: unknown }) {
  const errors: string[] = [];
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const password = typeof input.password === 'string' ? input.password : '';

  if (!email || !isValidEmail(email)) errors.push('Enter a valid email address.');
  if (!password) errors.push('Password is required.');

  return { errors, values: { email, password } };
}

export function validateProfileUpdate(input: {
  username?: unknown;
  bio?: unknown;
  avatar?: unknown;
}) {
  const errors: string[] = [];
  const values: { username?: string; bio?: string; avatar?: string } = {};

  if (input.username !== undefined) {
    const username = typeof input.username === 'string' ? input.username.trim() : '';
    if (!username) errors.push('Username cannot be empty.');
    else if (username.length > 50) errors.push('Username must be 50 characters or less.');
    else if (!/^[a-zA-Z0-9_\-. ]+$/.test(username)) errors.push('Username contains invalid characters.');
    else values.username = username;
  }

  if (input.bio !== undefined) {
    const bio = typeof input.bio === 'string' ? input.bio.trim() : '';
    if (bio.length > 500) errors.push('Bio must be 500 characters or less.');
    else values.bio = bio;
  }

  if (input.avatar !== undefined) {
    const avatar = typeof input.avatar === 'string' ? input.avatar.trim() : '';
    if (!VALID_AVATAR_IDS.has(avatar)) errors.push('Invalid avatar selection.');
    else values.avatar = avatar;
  }

  return { errors, values };
}
