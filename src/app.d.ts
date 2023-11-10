// See https://kit.svelte.dev/docs/types#app

import type { User } from '@prisma/client';

// Create a signed in user type which has the same fields as the User type, but with the password field removed
type SignedInUser = Omit<User, 'password'>;

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: SignedInUser | null;
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
