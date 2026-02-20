export const getDateRange = (
  period: string,
  startDate?: string,
  endDate?: string
): { start: string; end: string } => {
  if (startDate && endDate) {
    return { start: startDate, end: endDate };
  }

  const end = new Date();
  const start = new Date();

  switch (period) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '14d':
      start.setDate(end.getDate() - 14);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '60d':
      start.setDate(end.getDate() - 60);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    default:
      start.setDate(end.getDate() - 30);
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
};

