/**
 * Public page routes for Wedding Jarvis
 *
 * These are standalone pages linked from WhatsApp messages.
 * Each page has language-specific versions (/dress-code, /dress-code/hi, /dress-code/pa).
 */

import { Router, Request, Response } from 'express';
import { getSupabase } from '../db/client';
import type { UserLanguage } from '../types';
import { getMessage } from '../i18n';

/**
 * Partial event data for dress code page (only fields we select)
 */
interface DressCodeEvent {
  name: string;
  name_hi: string | null;
  name_pa: string | null;
  dress_code: string | null;
  dress_code_hi: string | null;
  dress_code_pa: string | null;
  start_time: string;
}

const router = Router();

// ============================================================
// DRESS CODE PAGES
// ============================================================

/**
 * Get dress code content for all events
 */
async function getDressCodeContent(language: UserLanguage): Promise<string> {
  const supabase = getSupabase();

  const { data: events, error } = await supabase
    .from('events')
    .select('name, name_hi, name_pa, dress_code, dress_code_hi, dress_code_pa, start_time')
    .not('dress_code', 'is', null)
    .order('sort_order', { ascending: true });

  if (error || !events || events.length === 0) {
    return getMessage('error.noData', language);
  }

  const locale = language === 'EN' ? 'en-US' : language === 'HI' ? 'hi-IN' : 'pa-IN';

  const eventDressCodes = events
    .filter((event: DressCodeEvent) => event.dress_code)
    .map((event: DressCodeEvent) => {
      const name =
        (language === 'HI' && event.name_hi) ||
        (language === 'PA' && event.name_pa) ||
        event.name;

      const dressCode =
        (language === 'HI' && event.dress_code_hi) ||
        (language === 'PA' && event.dress_code_pa) ||
        event.dress_code;

      const date = new Date(event.start_time);
      const dateStr = date.toLocaleDateString(locale, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });

      return { name, dressCode, dateStr };
    });

  return JSON.stringify(eventDressCodes);
}

/**
 * Render dress code page HTML
 */
function renderDressCodePage(language: UserLanguage, eventsData: string): string {
  const title = getMessage('dressCode.title', language);
  const description = getMessage('dressCode.description', language);

  let events: Array<{ name: string; dressCode: string; dateStr: string }> = [];
  try {
    events = JSON.parse(eventsData);
  } catch {
    // If parsing fails, show error message
  }

  const dir = language === 'EN' ? 'ltr' : 'ltr'; // Hindi and Punjabi are also LTR
  const fontFamily =
    language === 'PA'
      ? "'Noto Sans Gurmukhi', 'Mukta Mahee', sans-serif"
      : language === 'HI'
        ? "'Noto Sans Devanagari', 'Mukta', sans-serif"
        : "'Inter', 'Segoe UI', sans-serif";

  const eventCards = events
    .map(
      (event) => `
      <div class="event-card">
        <div class="event-header">
          <h2>${escapeHtml(event.name)}</h2>
          <span class="event-date">${escapeHtml(event.dateStr)}</span>
        </div>
        <div class="dress-code">
          ${escapeHtml(event.dressCode)}
        </div>
      </div>
    `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="${language.toLowerCase()}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - Sanjoli & Shreyas</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Mukta:wght@400;500;600&family=Mukta+Mahee:wght@400;500;600&family=Noto+Sans+Devanagari:wght@400;500;600&family=Noto+Sans+Gurmukhi:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: ${fontFamily};
      background: linear-gradient(135deg, #fef3f0 0%, #fff5f2 50%, #fef8f5 100%);
      min-height: 100vh;
      padding: 24px 16px;
      color: #333;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      margin-bottom: 32px;
      padding: 24px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    }

    .header h1 {
      font-size: 28px;
      font-weight: 600;
      color: #c17a5f;
      margin-bottom: 8px;
    }

    .header p {
      font-size: 16px;
      color: #666;
    }

    .event-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border-left: 4px solid #c17a5f;
    }

    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .event-header h2 {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .event-date {
      font-size: 14px;
      color: #888;
      background: #f5f5f5;
      padding: 4px 10px;
      border-radius: 20px;
    }

    .dress-code {
      font-size: 16px;
      color: #555;
      line-height: 1.6;
      padding: 12px;
      background: #fef8f5;
      border-radius: 8px;
    }

    .footer {
      text-align: center;
      margin-top: 32px;
      padding: 16px;
      color: #999;
      font-size: 14px;
    }

    .lang-switcher {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .lang-switcher a {
      padding: 8px 16px;
      background: white;
      border-radius: 20px;
      text-decoration: none;
      color: #666;
      font-size: 14px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
      transition: all 0.2s;
    }

    .lang-switcher a:hover {
      background: #c17a5f;
      color: white;
    }

    .lang-switcher a.active {
      background: #c17a5f;
      color: white;
    }
  </style>
</head>
<body>
  <div class="container">
    <nav class="lang-switcher">
      <a href="/dress-code" ${language === 'EN' ? 'class="active"' : ''}>English</a>
      <a href="/dress-code/hi" ${language === 'HI' ? 'class="active"' : ''}>हिंदी</a>
      <a href="/dress-code/pa" ${language === 'PA' ? 'class="active"' : ''}>ਪੰਜਾਬੀ</a>
    </nav>

    <div class="header">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
    </div>

    ${eventCards || '<p style="text-align: center; color: #666;">No dress code information available.</p>'}

    <div class="footer">
      Sanjoli & Shreyas &bull; February 2026
    </div>
  </div>
</body>
</html>`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}

// Dress Code - English (default)
router.get('/dress-code', async (_req: Request, res: Response) => {
  try {
    const eventsData = await getDressCodeContent('EN');
    const html = renderDressCodePage('EN', eventsData);
    res.type('html').send(html);
  } catch (error) {
    console.error('[PAGES] Error rendering dress code page:', error);
    res.status(500).send('Error loading page');
  }
});

// Dress Code - Hindi
router.get('/dress-code/hi', async (_req: Request, res: Response) => {
  try {
    const eventsData = await getDressCodeContent('HI');
    const html = renderDressCodePage('HI', eventsData);
    res.type('html').send(html);
  } catch (error) {
    console.error('[PAGES] Error rendering dress code page (Hindi):', error);
    res.status(500).send('Error loading page');
  }
});

// Dress Code - Punjabi
router.get('/dress-code/pa', async (_req: Request, res: Response) => {
  try {
    const eventsData = await getDressCodeContent('PA');
    const html = renderDressCodePage('PA', eventsData);
    res.type('html').send(html);
  } catch (error) {
    console.error('[PAGES] Error rendering dress code page (Punjabi):', error);
    res.status(500).send('Error loading page');
  }
});

// ============================================================
// GIFTS REGISTRY PAGES
// ============================================================

/**
 * Render gift registry page HTML
 */
function renderGiftsPage(language: UserLanguage): string {
  const title = getMessage('gifts.page.title', language);
  const description = getMessage('gifts.page.description', language);
  const presenceTitle = getMessage('gifts.page.presenceTitle', language);
  const presenceText = getMessage('gifts.page.presenceText', language);
  const blessingTitle = getMessage('gifts.page.blessingTitle', language);
  const blessingText = getMessage('gifts.page.blessingText', language);
  const contactTitle = getMessage('gifts.page.contactTitle', language);
  const contactText = getMessage('gifts.page.contactText', language);

  const dir = 'ltr'; // Hindi and Punjabi are also LTR
  const fontFamily =
    language === 'PA'
      ? "'Noto Sans Gurmukhi', 'Mukta Mahee', sans-serif"
      : language === 'HI'
        ? "'Noto Sans Devanagari', 'Mukta', sans-serif"
        : "'Inter', 'Segoe UI', sans-serif";

  return `<!DOCTYPE html>
<html lang="${language.toLowerCase()}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - Sanjoli & Shreyas</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Mukta:wght@400;500;600&family=Mukta+Mahee:wght@400;500;600&family=Noto+Sans+Devanagari:wght@400;500;600&family=Noto+Sans+Gurmukhi:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: ${fontFamily};
      background: linear-gradient(135deg, #fef3f0 0%, #fff5f2 50%, #fef8f5 100%);
      min-height: 100vh;
      padding: 24px 16px;
      color: #333;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      margin-bottom: 32px;
      padding: 24px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    }

    .header h1 {
      font-size: 28px;
      font-weight: 600;
      color: #c17a5f;
      margin-bottom: 8px;
    }

    .header p {
      font-size: 16px;
      color: #666;
    }

    .gift-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border-left: 4px solid #c17a5f;
    }

    .gift-card h2 {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin-bottom: 12px;
    }

    .gift-card .icon {
      font-size: 24px;
      margin-right: 8px;
    }

    .gift-content {
      font-size: 16px;
      color: #555;
      line-height: 1.6;
      padding: 12px;
      background: #fef8f5;
      border-radius: 8px;
    }

    .footer {
      text-align: center;
      margin-top: 32px;
      padding: 16px;
      color: #999;
      font-size: 14px;
    }

    .lang-switcher {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .lang-switcher a {
      padding: 8px 16px;
      background: white;
      border-radius: 20px;
      text-decoration: none;
      color: #666;
      font-size: 14px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
      transition: all 0.2s;
    }

    .lang-switcher a:hover {
      background: #c17a5f;
      color: white;
    }

    .lang-switcher a.active {
      background: #c17a5f;
      color: white;
    }
  </style>
</head>
<body>
  <div class="container">
    <nav class="lang-switcher">
      <a href="/gifts" ${language === 'EN' ? 'class="active"' : ''}>English</a>
      <a href="/gifts/hi" ${language === 'HI' ? 'class="active"' : ''}>हिंदी</a>
      <a href="/gifts/pa" ${language === 'PA' ? 'class="active"' : ''}>ਪੰਜਾਬੀ</a>
    </nav>

    <div class="header">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
    </div>

    <div class="gift-card">
      <h2><span class="icon">💝</span>${escapeHtml(presenceTitle)}</h2>
      <div class="gift-content">
        ${escapeHtml(presenceText)}
      </div>
    </div>

    <div class="gift-card">
      <h2><span class="icon">🙏</span>${escapeHtml(blessingTitle)}</h2>
      <div class="gift-content">
        ${escapeHtml(blessingText)}
      </div>
    </div>

    <div class="gift-card">
      <h2><span class="icon">📞</span>${escapeHtml(contactTitle)}</h2>
      <div class="gift-content">
        ${escapeHtml(contactText)}
      </div>
    </div>

    <div class="footer">
      Sanjoli & Shreyas &bull; February 2026
    </div>
  </div>
</body>
</html>`;
}

// Gifts Registry - English (default)
router.get('/gifts', async (_req: Request, res: Response) => {
  try {
    const html = renderGiftsPage('EN');
    res.type('html').send(html);
  } catch (error) {
    console.error('[PAGES] Error rendering gifts page:', error);
    res.status(500).send('Error loading page');
  }
});

// Gifts Registry - Hindi
router.get('/gifts/hi', async (_req: Request, res: Response) => {
  try {
    const html = renderGiftsPage('HI');
    res.type('html').send(html);
  } catch (error) {
    console.error('[PAGES] Error rendering gifts page (Hindi):', error);
    res.status(500).send('Error loading page');
  }
});

// Gifts Registry - Punjabi
router.get('/gifts/pa', async (_req: Request, res: Response) => {
  try {
    const html = renderGiftsPage('PA');
    res.type('html').send(html);
  } catch (error) {
    console.error('[PAGES] Error rendering gifts page (Punjabi):', error);
    res.status(500).send('Error loading page');
  }
});

export default router;
