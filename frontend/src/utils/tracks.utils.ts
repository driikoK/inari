import { TrackType } from '@/types';

export const processTracks = (tracks: TrackType[]) => {
  const uniqueTracks = tracks.reduce<TrackType[]>((acc, curr) => {
    const existing = acc.find((item) => item.nickname === curr.nickname);

    if (existing) {
      existing.coin += curr.coin;
    } else {
      acc.push({ ...curr });
    }

    return acc;
  }, []);
  const sortedTracks = uniqueTracks.sort(
    (trackA, trackB) => trackB.coin - trackA.coin
  );
  const tracksHalfIndex = Math.ceil(sortedTracks.length / 2);
  const tracksFirstHalf = sortedTracks.slice(0, tracksHalfIndex);
  const tracksSecondHalf = sortedTracks.slice(tracksHalfIndex);
  return { tracksFirstHalf, tracksSecondHalf, tracksHalfIndex, sortedTracks };
};
