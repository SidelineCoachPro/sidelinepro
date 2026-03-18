export type Template = {
  id: string
  icon: string
  title: string
  accent: string
  subject: string
  body: string
}

export const TEMPLATES: Template[] = [
  {
    id: 'practice-reminder',
    icon: '📅',
    title: 'Practice Reminder',
    accent: '#38BDF8',
    subject: 'Practice Reminder — [Team Name]',
    body: 'Hi! Just a reminder that practice is [tomorrow/today] at [time] at [location]. Please bring water and wear athletic shoes. See you on the court! — Coach [name]',
  },
  {
    id: 'game-day',
    icon: '🏀',
    title: 'Game Day Notice',
    accent: '#F7620A',
    subject: 'Game Day — vs [Opponent]',
    body: 'Game day! We play [opponent] today at [time]. Please arrive 30 minutes early for warmups at [location]. Let\'s go! — Coach [name]',
  },
  {
    id: 'practice-cancelled',
    icon: '🌧',
    title: 'Practice Cancelled',
    accent: '#6B7280',
    subject: 'Practice Cancelled',
    body: 'Hi everyone — practice today has been cancelled due to [reason]. We will reschedule. I\'ll be in touch with the new date. Apologies for the short notice! — Coach [name]',
  },
  {
    id: 'great-practice',
    icon: '⭐',
    title: 'Great Practice Shoutout',
    accent: '#F5B731',
    subject: 'Great Practice Today!',
    body: 'Wanted to share — the team had an incredible practice today. Everyone brought great energy and worked hard. Really proud of this group. Keep it up! — Coach [name]',
  },
  {
    id: 'schedule-change',
    icon: '📆',
    title: 'Schedule Change',
    accent: '#8B5CF6',
    subject: 'Schedule Change',
    body: 'Hi! Heads up — there\'s been a change to our schedule. [Details]. Please update your calendar. Let me know if you have any questions. — Coach [name]',
  },
  {
    id: 'dev-plan',
    icon: '✨',
    title: 'Development Plan Ready',
    accent: '#0ECFB0',
    subject: '[Player Name]\'s Development Plan',
    body: 'Hi! I\'ve put together a personalized at-home development plan for [player name]. [Plan details]. Even 15 minutes a day makes a huge difference at this age. Thanks for your support! — Coach [name]',
  },
  {
    id: 'game-recap',
    icon: '🏆',
    title: 'Game Recap',
    accent: '#22C55E',
    subject: 'Game Recap — vs [Opponent]',
    body: 'Great effort today! We [won/lost] [score] vs [opponent]. The team showed real heart out there. [Personal note]. Keep working hard — next game is [date]. — Coach [name]',
  },
  {
    id: 'custom',
    icon: '✏️',
    title: 'Custom Message',
    accent: '#F1F5F9',
    subject: '[Custom subject]',
    body: '[Write your own message here]',
  },
]
