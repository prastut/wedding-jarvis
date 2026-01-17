/**
 * English translations for Wedding Jarvis Bot
 *
 * This is the base/fallback language. All keys must be defined here.
 */

export const messages = {
  // ============================================================
  // WELCOME / LANGUAGE SELECTION
  // ============================================================
  'welcome.title': "Welcome to Sanjoli & Shreyas's Wedding! \u{1F338}",
  'welcome.selectLanguage': 'Please select your language:',

  // ============================================================
  // SIDE SELECTION
  // ============================================================
  'side.thankYou': 'Thank you! \u{1F64F}',
  'side.selectPrompt': 'Please select your side:',
  'side.button.groom': "Groom's Side (Shreyas)",
  'side.button.bride': "Bride's Side (Sanjoli)",

  // ============================================================
  // ONBOARDING COMPLETE
  // ============================================================
  'onboarding.welcome': "Welcome, {sideName}! \u{1F389}\n\nYou're all set!",
  'onboarding.welcomeBack': 'Welcome back! \u{1F44B}',

  // ============================================================
  // MAIN MENU
  // ============================================================
  'menu.header': 'How can I help you today?',
  'menu.button': 'View Options',

  // Menu items - titles (max 24 chars for WhatsApp list)
  'menu.items.schedule.title': 'Event Schedule',
  'menu.items.schedule.description': 'View all wedding events',

  'menu.items.venue.title': 'Venue & Directions',
  'menu.items.venue.description': 'Get venue details & maps',

  'menu.items.travel.title': 'Travel & Stay',
  'menu.items.travel.description': 'Travel and accommodation info',

  'menu.items.rsvp.title': 'RSVP',
  'menu.items.rsvp.description': 'Confirm your attendance',

  'menu.items.emergency.title': 'Emergency Contact',
  'menu.items.emergency.description': 'Get help immediately',

  'menu.items.faq.title': 'FAQs',
  'menu.items.faq.description': 'Common questions answered',

  'menu.items.gifts.title': 'Gift Registry',
  'menu.items.gifts.description': 'View gift suggestions',

  'menu.items.reset.title': 'Change Language/Side',
  'menu.items.reset.description': 'Update your preferences',

  // ============================================================
  // NAVIGATION
  // ============================================================
  'nav.backToMenu': 'Back to Menu',

  // ============================================================
  // CONTENT HEADERS
  // ============================================================
  'content.schedule.header': '*Event Schedule*',
  'content.venue.header': '*Venue & Directions*',
  'content.faq.header': '*Frequently Asked Questions*',
  'content.emergency.header': '*Emergency Contact*',
  'content.travel.header': '*Travel & Stay*',
  'content.gifts.header': '*Gift Registry*',

  // ============================================================
  // CONTENT LABELS
  // ============================================================
  'content.venue.map': 'Map',
  'content.venue.parking': 'Parking',
  'content.event.venue': 'Venue',
  'content.event.at': 'at',
  'content.contact.phone': 'Phone',

  // ============================================================
  // RSVP FLOW
  // ============================================================
  'rsvp.prompt': 'Will you be attending?',
  'rsvp.button.yes': 'Yes, attending',
  'rsvp.button.no': "No, can't make it",
  'rsvp.countPrompt': 'How many guests will be attending (including yourself)?',
  'rsvp.countButton': 'Select Count',
  'rsvp.count.10plus': '10+ guests',
  'rsvp.confirmed.yes': "\u{1F4CB} *Your RSVP*\n\nStatus: Attending \u{2705}\nGuests: {count}\n\nNeed to make changes?",
  'rsvp.confirmed.no': "\u{1F4CB} *Your RSVP*\n\nStatus: Not Attending\n\nNeed to make changes?",
  'rsvp.thankYou.yes': 'Thank you for confirming! We look forward to celebrating with you. \u{1F389}',
  'rsvp.thankYou.no': "Thank you for letting us know. We'll miss you! \u{1F499}",
  'rsvp.thankYou.10plus': "Thank you! Our team will reach out soon to confirm details for your larger group. \u{1F389}",
  'rsvp.button.update': 'Update RSVP',
  'rsvp.button.back': 'Back to Menu',

  // ============================================================
  // RESET FLOW
  // ============================================================
  'reset.confirm': 'Your language and side preferences have been reset. Let\'s start fresh!',

  // ============================================================
  // FALLBACK / ERRORS
  // ============================================================
  'fallback.unknown': "I didn't understand that. Please select an option from the menu:",
  'error.noData': 'Information not available at the moment. Please try again later.',

  // ============================================================
  // STUB MESSAGES (for features coming soon)
  // ============================================================
  'stub.comingSoon': '{feature} feature coming soon!',

  // ============================================================
  // COMMON
  // ============================================================
  'common.side.groom': "Groom's family",
  'common.side.bride': "Bride's family",

  // ============================================================
  // DRESS CODE PAGE
  // ============================================================
  'dressCode.title': 'Dress Code',
  'dressCode.description': 'Dress code information for all wedding events',

  // ============================================================
  // TRAVEL INFO
  // ============================================================
  'travel.info': '*Travel & Stay*\n\nAccommodation and travel details will be shared soon. For immediate assistance, please contact the emergency numbers.',

  // ============================================================
  // GIFT REGISTRY
  // ============================================================
  'gifts.info': '*Gift Registry*\n\nYour presence at our wedding is the greatest gift of all. However, if you wish to bless us, please visit our registry:\n\n{giftsLink}',

  // Gift Registry Page
  'gifts.page.title': 'Gift Registry',
  'gifts.page.description': 'Blessing the couple on their new journey',
  'gifts.page.presenceTitle': 'Your Presence',
  'gifts.page.presenceText': 'Your presence at our wedding is the greatest gift of all. We are truly honored to have you celebrate this special day with us.',
  'gifts.page.blessingTitle': 'Blessings & Shagun',
  'gifts.page.blessingText': 'If you wish to bless us, your love and good wishes mean the world to us. For those who prefer to give shagun, please feel free to do so in person or reach out to the family.',
  'gifts.page.contactTitle': 'Contact Us',
  'gifts.page.contactText': 'For any questions about gifts or contributions, please contact the family coordinators listed in the Emergency Contact section of the bot.',

  // ============================================================
  // POST-WEDDING
  // ============================================================
  'postWedding.thankYou': "Thank you for being part of Sanjoli & Shreyas's wedding celebration! \u{1F496}\n\nWe hope you had a wonderful time. For any queries, feel free to reach out to the family.",

  // ============================================================
  // OPT-OUT/OPT-IN
  // ============================================================
  'optOut.confirm': 'You have been unsubscribed. Reply START to subscribe again.',
} as const;
