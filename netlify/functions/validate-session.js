import Redis from 'ioredis';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const redis = new Redis(process.env.REDIS_URL); // Redis connection

export const handler = async (event) => {
  console.log('Session validation request received:', JSON.stringify(event, null, 2));

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Step 1: Extract session token from query parameters
    const { token } = event.queryStringParameters || {};

    if (!token) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Missing session token' }),
      };
    }

    console.log(`Validating session token: ${token}`);

    // Step 2: Retrieve session data from Redis
    const sessionData = await redis.get(token);

    if (!sessionData) {
      return {
        statusCode: 403,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Invalid or expired session token' }),
      };
    }

    const { contractId, used } = JSON.parse(sessionData);

    if (used) {
      return {
        statusCode: 403,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Session token has already been used' }),
      };
    }

    // Step 3: Mark the session token as used
    await redis.set(token, JSON.stringify({ contractId, used: true }));

    console.log(`Session token validated successfully for contractId: ${contractId}`);

    // Step 4: Return the contract ID for further use
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        message: 'Session validated successfully',
        contractId: contractId,
      }),
    };
  } catch (error) {
    console.error('Error validating session:', error.message || error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
