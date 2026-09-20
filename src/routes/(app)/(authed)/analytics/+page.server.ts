import {
  getListeningAnalytics,
  getListeningSummary,
  nonMigratedSessionWhere,
  type RankingMetric
} from '$lib/server/listeningStats.js';
import prisma from '$lib/server/prisma.js';

import type { PageServerLoad } from './$types';

function positiveInteger(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function previousRange(view: 'year' | 'month', year: number, month: number) {
  if (view === 'year') return { year: year - 1 };
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

export const load: PageServerLoad = async ({ locals, url }) => {
  const userId = locals.user!.id;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const firstEvent = await prisma.listeningEvent.findFirst({
    where: { session: nonMigratedSessionWhere(userId) },
    orderBy: { startedAt: 'asc' },
    select: { startedAt: true }
  });

  const firstYear = firstEvent?.startedAt.getFullYear() ?? currentYear;
  const firstMonth = firstEvent ? firstEvent.startedAt.getMonth() + 1 : 1;
  const requestedYear = positiveInteger(url.searchParams.get('year'));
  let year = currentYear;
  if (requestedYear && requestedYear >= firstYear && requestedYear <= currentYear) {
    year = requestedYear;
  }

  const requestedMonth = positiveInteger(url.searchParams.get('month'));
  let month = currentMonth;
  if (
    requestedMonth &&
    requestedMonth <= 12 &&
    (year < currentYear || requestedMonth <= currentMonth) &&
    (year > firstYear || requestedMonth >= firstMonth)
  ) {
    month = requestedMonth;
  }
  const view = url.searchParams.get('view') === 'year' ? 'year' : 'month';
  const metric: RankingMetric =
    url.searchParams.get('metric') === 'plays' ? 'plays' : 'listeningTime';
  const selectedRange = view === 'year' ? { year } : { year, month };
  const availablePeriods: { year: number; month: number }[] = [];

  for (let periodYear = firstYear; periodYear <= currentYear; periodYear += 1) {
    const lastMonth = periodYear === currentYear ? currentMonth : 12;
    const startMonth = periodYear === firstYear ? firstMonth : 1;
    for (let periodMonth = startMonth; periodMonth <= lastMonth; periodMonth += 1) {
      availablePeriods.push({ year: periodYear, month: periodMonth });
    }
  }

  const [analytics, previousSummary] = await Promise.all([
    getListeningAnalytics(userId, selectedRange, metric),
    getListeningSummary(userId, previousRange(view, year, month))
  ]);

  const shortMonthFormatter = new Intl.DateTimeFormat(undefined, { month: 'short' });
  const monthLabel = shortMonthFormatter.format(new Date(year, month - 1));

  return {
    period: { ...selectedRange, view, metric },
    availablePeriods,
    ...analytics,
    previousSummary,
    title: view === 'year' ? `Analytics for ${year}` : `Analytics for ${monthLabel} ${year}`
  };
};
