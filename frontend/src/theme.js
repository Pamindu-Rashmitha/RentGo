export const colors = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  cardBorder: 'rgba(0, 0, 0, 0.05)',
  primary: '#6366F1',
  primaryLight: '#4F46E5',
  primaryBg: 'rgba(99, 102, 241, 0.1)',
  primaryBorder: 'rgba(99, 102, 241, 0.2)',
  secondary: '#A855F7',
  secondaryBg: 'rgba(168, 85, 247, 0.1)',
  secondaryBorder: 'rgba(168, 85, 247, 0.2)',
  text: '#1E293B',
  textSecondary: '#475569',
  textMuted: '#64748B',
  inputBg: '#FFFFFF',
  inputBorder: 'rgba(0, 0, 0, 0.1)',
  error: '#EF4444',
  errorLight: '#DC2626',
  errorBg: 'rgba(239, 68, 68, 0.1)',
  errorBorder: 'rgba(239, 68, 68, 0.2)',
  success: '#10B981',
  successBg: 'rgba(16, 185, 129, 0.1)',
  successBorder: 'rgba(16, 185, 129, 0.2)',
  warning: '#F59E0B',
  warningBg: 'rgba(245, 158, 11, 0.1)',
  warningBorder: 'rgba(245, 158, 11, 0.2)',
  blue: '#3B82F6',
  blueBg: 'rgba(59, 130, 246, 0.1)',
  blueBorder: 'rgba(59, 130, 246, 0.2)',
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const statusColors = {
  Pending_License: { bg: colors.warningBg, text: colors.warning, border: colors.warningBorder },
  Awaiting_Payment: { bg: colors.blueBg, text: colors.blue, border: colors.blueBorder },
  Confirmed: { bg: colors.successBg, text: colors.success, border: colors.successBorder },
  Completed: { bg: colors.primaryBg, text: colors.primaryLight, border: colors.primaryBorder },
  Cancelled: { bg: colors.errorBg, text: colors.errorLight, border: colors.errorBorder },
  Available: { bg: colors.successBg, text: colors.success, border: colors.successBorder },
  Under_Maintenance: { bg: colors.warningBg, text: colors.warning, border: colors.warningBorder },
  Payment_Under_Review: { bg: colors.warningBg, text: colors.warning, border: colors.warningBorder },
  Paid: { bg: colors.successBg, text: colors.success, border: colors.successBorder },
  Voided: { bg: colors.errorBg, text: colors.errorLight, border: colors.errorBorder },
  Open: { bg: colors.blueBg, text: colors.blue, border: colors.blueBorder },
  In_Progress: { bg: colors.warningBg, text: colors.warning, border: colors.warningBorder },
};

export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatCurrency = (amount) => {
  return `LKR ${parseFloat(amount).toFixed(2)}`;
};

export const formatStatus = (status) => {
  return (status || '').replace(/_/g, ' ');
};
