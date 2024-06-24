export const baseYear = 2024;

export function determineAnimeSeason(month: number, year: number): number {
     return determineAnimeSeasonMonth(month) + (4 * determineAnimeSeasonYear(month, year) - baseYear);
}

function determineAnimeSeasonMonth(month: number): number {
    if (month >= 3 && month <= 5) {  // квітень, травень, червень - весна
        return 1;
    } else if (month >= 6 && month <= 8) {  // липень, серпень, вересень - літо
        return 2
    } else if (month >= 9 && month <= 11) {  // жовтень, листопад, грудень - осінь
        return 3;
    } else {  // січень, лютий, березень - зима
        return 4;
    }
}

function determineAnimeSeasonYear(year: number, month: number): number {
    if (month >= 2) {
        return year;
    } else {
        return year - 1;
    }
}