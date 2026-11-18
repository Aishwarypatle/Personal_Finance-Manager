import assert from 'node:assert/strict';
import test from 'node:test';
import {
  authConfigured,
  authorized,
  issueSession,
  validPassword,
} from '../lib/auth';

function mockRequest(cookieValue?: string) {
  return {
    cookies: {
      get: (name: string) => name === 'finance_session' && cookieValue ? { value: cookieValue } : undefined,
    },
  } as never;
}

function withAuthEnvironment(run: () => void) {
  const previous = {
    appPassword: process.env.APP_PASSWORD,
    sessionSecret: process.env.SESSION_SECRET,
    nodeEnv: process.env.NODE_ENV,
  };
  process.env.APP_PASSWORD = 'test-password';
  process.env.SESSION_SECRET = 'test-session-secret';
  Reflect.set(process.env, 'NODE_ENV', 'production');
  try {
    run();
  } finally {
    if (previous.appPassword === undefined) delete process.env.APP_PASSWORD;
    else process.env.APP_PASSWORD = previous.appPassword;
    if (previous.sessionSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = previous.sessionSecret;
    if (previous.nodeEnv === undefined) Reflect.deleteProperty(process.env, 'NODE_ENV');
    else Reflect.set(process.env, 'NODE_ENV', previous.nodeEnv);
  }
}

test('password validation requires the configured password', () => {
  withAuthEnvironment(() => {
    assert.equal(authConfigured(), true);
    assert.equal(validPassword('test-password'), true);
    assert.equal(validPassword('wrong-password'), false);
  });
});

test('only a valid signed, unexpired session authorizes protected routes', () => {
  withAuthEnvironment(() => {
    const validSession = issueSession();
    assert.equal(authorized(mockRequest(validSession)), true);
    assert.equal(authorized(mockRequest('invalid.token')), false);
    assert.equal(authorized(mockRequest()), false);
  });
});
