export const API_CONFIG = {
  BASE_URL: 'https://world-bingo-mobile-app-backend-230041233104.us-central1.run.app',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    VERIFY_OTP: '/api/v1/auth/verify-otp',
    REGISTER: '/api/v1/auth/register',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    VERIFY_RESET_OTP: '/api/v1/auth/verify-reset-otp',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
    CHANGE_PASSWORD: '/api/v1/auth/change-password',
    REFRESH_TOKEN: '/api/v1/auth/refresh-token',
    LOGOUT: '/api/v1/auth/logout',
  },
  USER: {
    PROFILE: '/api/v1/user/profile',
    UPDATE_PROFILE: '/api/v1/user/profile',
  },
  GAME: {
    CREATE: '/api/v1/game/create',
    JOIN: '/api/v1/game/join',
    LEAVE: '/api/v1/game/leave',
    GET_GAMES: '/api/v1/game/list',
    GET_GAME: '/api/v1/game',
  },
  REPORT: {
    CREATE: '/api/v1/report',
    GET_ALL: '/api/v1/report',
    GET_BY_USER: '/api/v1/report/user',
    UPDATE: '/api/v1/report',
    INCREMENT: '/api/v1/report/increment',
  },
  TRANSACTION: {
    CREATE: '/api/v1/transaction',
    GET_ALL: '/api/v1/transaction',
    GET_BY_USER: '/api/v1/transaction/user',
    GET_BY_ID: '/api/v1/transaction',
    UPDATE: '/api/v1/transaction',
    DELETE: '/api/v1/transaction',
    GET_BY_DATE_RANGE: '/api/v1/transaction/range',
  },
  COIN: {
    GET_BALANCE: '/api/v1/coin/',
    SETTLE: '/api/v1/coin/settle',
  },
  FILE: {
    DOWNLOAD: '/api/v1/file/download',
    UPLOAD: '/api/v1/file/upload',
    LIST: '/api/v1/file/list',
    DELETE: '/api/v1/file/delete',
  },
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;