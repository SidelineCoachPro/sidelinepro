import { StyleSheet, Font } from '@react-pdf/renderer'

// Register fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2' },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2', fontWeight: 700 },
  ],
})

export const PDF_COLORS = {
  orange:   '#F7620A',
  dark:     '#0E1520',
  ink:      '#1A2535',
  white:    '#FFFFFF',
  offwhite: '#F1F5F9',
  muted:    '#6B7A99',
  border:   '#E2E8F0',
  teal:     '#0ECFB0',
  violet:   '#8B5CF6',
  gold:     '#F5B731',
  green:    '#22C55E',
  sky:      '#38BDF8',
  lightbg:  '#F8FAFC',
  orangebg: '#FFF4EE',
}

export const baseStyles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: PDF_COLORS.dark,
    backgroundColor: PDF_COLORS.white,
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 40,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: PDF_COLORS.orange,
  },
  logo: {
    fontSize: 18,
    fontWeight: 700,
    color: PDF_COLORS.orange,
  },
  logoSub: {
    fontSize: 9,
    color: PDF_COLORS.muted,
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.border,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: PDF_COLORS.muted,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: PDF_COLORS.orange,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  card: {
    backgroundColor: PDF_COLORS.lightbg,
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
  orangeCard: {
    backgroundColor: PDF_COLORS.orangebg,
    borderLeftWidth: 3,
    borderLeftColor: PDF_COLORS.orange,
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: PDF_COLORS.lightbg,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
  },
  tagText: {
    fontSize: 8,
    color: PDF_COLORS.muted,
  },
})
