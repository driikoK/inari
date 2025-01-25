export const prettifyDate = (date: string) =>
  new Date(date)
    .toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    })
    .replace(',', '\n');
