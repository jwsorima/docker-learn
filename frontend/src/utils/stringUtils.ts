export const getStatusColor = (status: string) => {
  switch (status) {
    case 'Pending':
      return 'warning.main';
    case 'Scheduled':
      return 'info.main';
    case 'Passed':
      return 'success.main';
    case 'NotPassed':
      return 'error.main';
    case 'NoShow':
      return 'text.secondary';
    default:
      return 'text.primary';
  }
};

export const getListStatusColor = (theme: any, status: string) => {
  switch (status) {
    case 'Passed':
      return theme.palette.success.main;
    case 'NotPassed':
      return theme.palette.error.main;
    case 'NoShow':
      return theme.palette.text.secondary;
    default:
      return theme.palette.text.primary;
  }
};