module.exports = {
  AUTH: {
    REGISTER_SUCCESS: 'Registration successful',
    LOGIN_SUCCESS: 'Logged in successfully',
    LOGOUT_SUCCESS: 'Logged out successfully',
    UNAUTHORIZED: 'Authentication required. Please log in.',
    FORBIDDEN: 'Forbidden: Admin privilege required.',
    USER_EXISTS: 'User with this email already exists',
    INVALID_CREDENTIALS: 'Invalid email or password'
  },
  PROPERTY: {
    NOT_FOUND: 'Property requested was not found',
    CREATED: 'Property created successfully',
    DELETED: 'Property removed successfully'
  },
  NAV: {
    PATH_FOUND: 'Shortest path calculated successfully',
    NO_PATH: 'No valid path found between selected locations',
    START_NOT_FOUND: 'Start navigation point not found'
  }
};
