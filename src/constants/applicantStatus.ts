export const STATUS_OPTIONS = [
  'Waiting HR Approve',
  'Waiting candidate Info',
  'Waiting HR Re-check',
  'Favorite',
  'Nagotiate Process',
  'Nagotiate Success',
  'Nagotiate Failed',
  'Nagotiate Cancel',
  'Employment confirm',
  'Reject',
]

export const STATUS_COLOR: Record<string, string> = {
  'Waiting HR Approve': 'orange',
  'Waiting candidate Info': 'orange',
  'Waiting HR Re-check': 'orange',
  Favorite: 'gold',
  'Nagotiate Process': 'blue',
  'Nagotiate Success': 'cyan',
  'Nagotiate Failed': 'red',
  'Nagotiate Cancel': 'default',
  'Employment confirm': 'green',
  Reject: 'red',
}

export const EMAIL_TRIGGER_TYPES = new Set([
  'Hire',
  'Selected',
  'Employment confirm',
  'Nagotiate Process',
  'notiMail',
])
