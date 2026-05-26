import { z } from 'zod';

//
// [Firebase Auth] JWT verified successfully. Payload: {
//   iss: 'https://securetoken.google.com/heydayproject',
//   aud: 'heydayproject',
//   auth_time: 1776548281,
//   user_id: 'nJ2tqNAe6dV3XfVeYlpXLZX0kOf2',
//   sub: 'nJ2tqNAe6dV3XfVeYlpXLZX0kOf2',
//   iat: 1776548281,
//   exp: 1776551881,
//   email: 'whynotmihir@gmail.com',
//   email_verified: false,
//   firebase: { identities: { email: [Array] }, sign_in_provider: 'password' }
// }
// User info extracted from Firebase JWT
export const FirebaseUserSchema = z.object({
	email: z.string(),
	email_verified: z.boolean(),
	user_id: z.string(),
});

export type FirebaseUser = z.infer<typeof FirebaseUserSchema>;

// Single JWK
export const FirebaseJWKSchema = z.object({
	kty: z.literal('RSA'),
	alg: z.literal('RS256'),
	use: z.literal('sig'),
	kid: z.string(),
	n: z.string(), // modulus
	e: z.string(), // exponent (always "AQAB" = 65537)
});

// The JWKS response with keys array
export const FirebaseJWKSResponseSchema = z.object({
	keys: z.array(FirebaseJWKSchema),
});

export type FirebaseJWK = z.infer<typeof FirebaseJWKSchema>;
export type FirebaseJWKSResponse = z.infer<typeof FirebaseJWKSResponseSchema>;
