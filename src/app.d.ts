// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces

import type { SignedInUser } from '$lib/shared/types';
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
