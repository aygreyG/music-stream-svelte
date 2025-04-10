<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidate } from '$app/navigation';
  import { vibrate } from '$lib/actions/vibrate';
  import { defaultTheme } from '$lib/shared/theme';
  import currentTheme from '$lib/stores/themeStore';
  import { getAccessibleColor, getRGBColor } from '$lib/utils';
  import type { Theme } from '@prisma/client';
  import { onMount } from 'svelte';
  import RoundRefresh from '~icons/ic/round-refresh';

  interface Props {
    action?: string;
    ownerTheme: Theme | null;
    owner?: boolean;
  }

  let { action = '?/updatetheme', ownerTheme, owner = false }: Props = $props();

  let start = $state($currentTheme.gradientStart);
  let middle = $state($currentTheme.gradientMiddle);
  let end = $state($currentTheme.gradientEnd);
  let middlepoint = $state($currentTheme.gradientMiddlePoint);
  let accent = $state($currentTheme.primary);
  let angle = $state($currentTheme.gradientAngle.replaceAll('_', ' '));
  let radius = $state($currentTheme.rounding);

  let loading = $state(false);

  $effect(() => {
    if (middlepoint) {
      if (middlepoint < 1) middlepoint = 1;
      if (middlepoint > 99) middlepoint = 99;
    }
  });

  function resetToCurrent() {
    start = $currentTheme.gradientStart;
    middle = $currentTheme.gradientMiddle;
    end = $currentTheme.gradientEnd;
    middlepoint = $currentTheme.gradientMiddlePoint;
    accent = $currentTheme.primary;
    angle = $currentTheme.gradientAngle.replaceAll('_', ' ');
    radius = $currentTheme.rounding;
  }

  function resetToDefault() {
    start = defaultTheme.gradientStart;
    middle = defaultTheme.gradientMiddle;
    end = defaultTheme.gradientEnd;
    middlepoint = defaultTheme.gradientMiddlePoint;
    accent = defaultTheme.primary;
    angle = defaultTheme.gradientAngle.replaceAll('_', ' ');
    radius = defaultTheme.rounding;
  }

  function resetToOwner() {
    if (ownerTheme) {
      start = ownerTheme.gradientStart;
      middle = ownerTheme.gradientMiddle;
      end = ownerTheme.gradientEnd;
      middlepoint = ownerTheme.gradientMiddlePoint;
      accent = ownerTheme.primary;
      angle = ownerTheme.gradientAngle.replaceAll('_', ' ');
      radius = ownerTheme.rounding;
    }
  }

  onMount(() => {
    const subscribtion = currentTheme.subscribe((val) => {
      start = val.gradientStart;
      middle = val.gradientMiddle;
      end = val.gradientEnd;
      middlepoint = val.gradientMiddlePoint;
      accent = val.primary;
      angle = val.gradientAngle.replaceAll('_', ' ');
      radius = val.rounding;
    });

    return () => {
      subscribtion();
    };
  });
</script>

<form
  class="flex select-none flex-col gap-2 p-4"
  method="POST"
  style="{getRGBColor(accent, 'primary')} {getRGBColor(
    getAccessibleColor(accent),
    'accessible'
  )} --rounding: {radius}px;"
  {action}
  use:enhance={() => {
    loading = true;
    return async ({ update, result }) => {
      await update({ reset: false });
      if (result.type === 'success' && result.data) {
        invalidate('mainLayout');
      }
      loading = false;
    };
  }}
>
  <div class="font-bold text-zinc-400">Background gradient</div>

  <div class="flex gap-10">
    <label class="flex w-full flex-col gap-1">
      <div class="text-sm font-bold text-zinc-400">Middle point</div>
      <input
        class="w-full rounded-md border-none bg-zinc-600/20 py-1 font-mono outline-none transition-all hover:bg-zinc-600/50 focus-visible:ring-2 focus-visible:ring-primary"
        name="middlepoint"
        type="number"
        min="1"
        max="99"
        bind:value={middlepoint}
        required
      />
    </label>
    <label class="flex w-full flex-col gap-1">
      <div class="text-sm font-bold text-zinc-400">Angle</div>
      <select
        class="w-full rounded-md border-none bg-zinc-600/20 py-1 outline-none transition-all focus-within:ring-2 focus-within:ring-primary hover:bg-zinc-600/50 focus-visible:ring-2 focus-visible:ring-primary"
        name="angle"
        bind:value={angle}
        required
      >
        <option value="to bottom">Top to bottom</option>
        <option value="to top">Bottom to top</option>
        <!-- <option disabled value="to right">Left to right</option>
        <option disabled value="to left">Right to left</option> -->
      </select>
    </label>
  </div>

  <div>
    <div class="flex justify-between pb-1">
      <label class="text-sm font-bold text-zinc-400" for="startcolor">Start color</label>
      <label class="text-sm font-bold text-zinc-400" for="middlecolor">Middle color</label>
      <label class="text-sm font-bold text-zinc-400" for="endcolor">End color</label>
    </div>
    <div class="flex justify-between gap-10">
      <input
        class="w-full rounded-md border-none bg-zinc-600/20 py-1 font-mono outline-none transition-all hover:bg-zinc-600/50 focus-visible:ring-2 focus-visible:ring-primary"
        type="text"
        bind:value={start}
        name="startcolortext"
      />
      <input
        class="w-full rounded-md border-none bg-zinc-600/20 py-1 text-center font-mono outline-none transition-all hover:bg-zinc-600/50 focus-visible:ring-2 focus-visible:ring-primary"
        type="text"
        bind:value={middle}
        name="middlecolortext"
      />
      <input
        class="w-full rounded-md border-none bg-zinc-600/20 py-1 text-end font-mono outline-none transition-all hover:bg-zinc-600/50 focus-visible:ring-2 focus-visible:ring-primary"
        type="text"
        bind:value={end}
        name="endcolortext"
      />
    </div>
  </div>

  <div class="flex gap-1">
    <label
      class="height-5 block w-2 flex-none cursor-pointer rounded-md focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary"
      style="background-color: {start};"
    >
      <input
        bind:value={start}
        class="size-px opacity-0"
        id="startcolor"
        type="color"
        name="startcolor"
        required
      />
    </label>

    <div
      class="rounded-md bg-gradient-to-r from-zinc-50"
      style="background-image: linear-gradient(to right, {start}, {middle}); width: {middlepoint}%;"
    ></div>

    <label
      class="height-5 block w-2 flex-none cursor-pointer rounded-md focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary"
      style="background-color: {middle};"
    >
      <input
        bind:value={middle}
        id="middlecolor"
        class="size-px opacity-0"
        type="color"
        name="middlecolor"
        required
      />
    </label>

    <div
      class="rounded-md bg-gradient-to-r from-zinc-50"
      style="background-image: linear-gradient(to right, {middle}, {end}); width: {100 -
        middlepoint}%;"
    ></div>

    <label
      class="height-5 block w-2 flex-none cursor-pointer rounded-md focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary"
      style="background-color: {end};"
    >
      <input
        bind:value={end}
        id="endcolor"
        class="size-px opacity-0"
        type="color"
        name="endcolor"
        required
      />
    </label>
  </div>

  <div
    class="size-24 place-self-center rounded-md"
    style="background-image: linear-gradient({angle}, {start}, {middle} {middlepoint}%, {end}); "
  ></div>

  <div class="flex items-center gap-6">
    <label for="accent" class="font-bold text-zinc-400">Accent color</label>
    <label
      class="block size-5 flex-none cursor-pointer rounded-md focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary"
      style="background-color: {accent};"
    >
      <input
        bind:value={accent}
        class="size-px opacity-0"
        id="accent"
        type="color"
        name="accent"
        required
      />
    </label>
    <input
      class="w-full rounded-md border-none bg-zinc-600/20 py-1 font-mono outline-none transition-all hover:bg-zinc-600/50 focus-visible:ring-2 focus-visible:ring-primary"
      type="text"
      name="accenttext"
      bind:value={accent}
    />
  </div>

  <div class="flex items-center gap-6">
    <label for="rounding" class="font-bold text-zinc-400">Rounding</label>
    <input
      class="w-full rounded-md border-none bg-zinc-600/20 py-1 font-mono outline-none transition-all hover:bg-zinc-600/50 focus-visible:ring-2 focus-visible:ring-primary"
      type="number"
      id="rounding"
      min="0"
      max="64"
      name="rounding"
      bind:value={radius}
      required
    />
  </div>

  <div class="flex w-full flex-col gap-2 sm:flex-row sm:gap-6">
    <button
      class="flex w-full items-center justify-center rounded-md bg-primary px-4 py-1 font-semibold text-accessible transition-all hover:bg-opacity-80"
      type="submit"
      use:vibrate
      disabled={loading}
    >
      {#if loading}
        <RoundRefresh class="h-6 w-6 animate-spin" />
      {:else}
        Update
      {/if}
    </button>

    {#if !owner && ownerTheme}
      <button
        class="w-full rounded-md bg-lime-700 px-4 py-1 font-semibold transition-all hover:bg-opacity-80"
        use:vibrate
        onclick={(event) => {
          event.preventDefault();
          resetToOwner?.();
        }}
        disabled={loading}
      >
        Owner
      </button>
    {/if}

    <button
      class="w-full rounded-md bg-amber-600 px-4 py-1 font-semibold transition-all hover:bg-opacity-80"
      use:vibrate
      onclick={(event) => {
        event.preventDefault();
        resetToCurrent?.();
      }}
      disabled={loading}
    >
      Reset
    </button>

    <button
      class="w-full rounded-md bg-rose-700 px-4 py-1 font-semibold transition-all hover:bg-opacity-80"
      use:vibrate
      onclick={(event) => {
        event.preventDefault();
        resetToDefault?.();
      }}
      disabled={loading}
    >
      Default
    </button>
  </div>
</form>

<style>
  input[type='color'] {
    appearance: none;
    padding: 0;
    background: none;
    border: none;
  }
</style>
