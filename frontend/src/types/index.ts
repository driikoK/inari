export type TAnime = {
  id: number,
  name: string,
  link: string,
  posterUrl: string,
  isOngoing: boolean,
}

export type TResultAnime = {
  anime: TAnime & {
    votes: {
      id: number,
      userName: string,
    }[],
  },
  voteCount: number,
}