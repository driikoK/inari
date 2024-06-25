const baseYear = 2024;

export function reverseDetermineAnimeSeason(seasonCode: number): string {
  const seasonNumber = (seasonCode - 1) % 4 + 1;
  const seasonYear = Math.floor((seasonCode + baseYear) / 4)

  const seasonName = determineSeasonName(seasonNumber);
  return `${seasonName} ${seasonYear}`;
}

function determineSeasonName(seasonNumber: number): string {
  switch (seasonNumber) {
      case 1:
          return "Весна";
      case 2:
          return "Літо";
      case 3:
          return "Осінь";
      case 4:
          return "Зима";
      default:
          return "";
  }
}