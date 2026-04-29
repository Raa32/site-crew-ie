import type { Rating } from '../../types';

/**
 * No-show is penalised heavily (40% total score reduction) — reflects
 * Irish site culture where unreliable workers get blacklisted quickly.
 */
export function calculateWorkerTrustScore(ratings: Rating[]): number {
  if (ratings.length === 0) return 0;

  const avgReliability = ratings.reduce((s, r) => s + r.reliabilityScore, 0) / ratings.length;
  const avgQuality = ratings.reduce((s, r) => s + r.qualityScore / 5, 0) / ratings.length;

  // Composite 0–1 score weighted 50/50
  let score = (avgReliability + avgQuality) / 2;

  // Any no-show tanks the score by 40%
  const hasNoShow = ratings.some((r) => r.isNoShow);
  if (hasNoShow) {
    score *= 0.6;
  }

  return Math.round(score * 100) / 100;
}
