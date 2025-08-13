// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import 'unplugin-icons/types/svelte';
import type { SignedInUser } from '$lib/shared/types';
import type { ServerSettings } from './generated/prisma-client/client';

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      user: SignedInUser | null;
      serverSettings: ServerSettings | null;
    }
    interface PageData {
      title?: string;
    }
    // interface Platform {}
  }

  interface ViewTransition {
    updateCallbackDone: Promise<void>;
    ready: Promise<void>;
    finished: Promise<void>;
    skipTransition: () => void;
  }

  interface Document {
    startViewTransition(updateCallback: () => Promise<void>): ViewTransition;
  }
}

export {};
