/**
 * src/content/sitePages.js
 * English site-page content for the footer pages (privacy, terms, cookies,
 * faq, help, about, contact, community, premium, report). The build imports
 * ASCII-named byte copies from ./pages below — git mis-encodes the en dash
 * (U+2013) in the /site-content file names on Linux (mojibake names in the
 * commit), which broke the Vercel build with ENOENT. Canonical text stays
 * in /site-content; keep the two in sync when the docs export changes.
 *
 * Each source file holds several pages split by '## ' headings. The text is
 * rendered as given — placeholders stay literal — except:
 *   - [support email] becomes the real support address used everywhere in
 *     the app (mailto link),
 *   - the [Upgrade to Premium] marker is removed and rendered as the real
 *     button by SitePage.jsx.
 *
 * NOTE: the export contains no "Terms of Service" section yet — terms stays
 * wired to the SitePage chrome with an explicit "text to be published"
 * empty state until the legal text is supplied (no placeholder legal text
 * is invented here).
 */

// Byte-identical copies of the /site-content docs exports under ASCII-safe
// file names (en-dash names in /site-content break on Linux CI — see header).
import privacyCookieSrc from './pages/privacy-cookie.md?raw';
import faqHelpSrc from './pages/faq-help.md?raw';
import aboutContactSrc from './pages/about-contact.md?raw';
import communityEtcSrc from './pages/community-premium-report.md?raw';

/** Support address used across the app (footer, placeholder page). */
export const SUPPORT_EMAIL = 'support@venoxa.ai';

/** Update date from the docs export header — shown in the page meta line. */
export const LAST_UPDATED = 'Nov 2, 2026';

/** Split a multi-page docs export into { heading: bodyMarkdown } by '## '. */
function splitPages(src) {
  const out = {};
  const re = /^## (.+?)(\r?\n|$)/gm;
  const marks = [];
  let m;
  while ((m = re.exec(src)) !== null) {
    marks.push({ title: m[1].trim(), start: m.index + m[0].length });
  }
  for (let i = 0; i < marks.length; i++) {
    const end = i + 1 < marks.length ? marks[i + 1].start : src.length;
    out[marks[i].title] = src.slice(marks[i].start, end);
  }
  return out;
}

/** [support email] → real mailto link; strip the Upgrade marker (real button). */
function prepare(body) {
  return body
    .replace(/\\\[support email\\\]/g, `[${SUPPORT_EMAIL}](mailto:${SUPPORT_EMAIL})`)
    .replace(/&#91;Upgrade to Premium&#93;/g, '');
}

const privacyCookie = splitPages(privacyCookieSrc);
const faqHelp = splitPages(faqHelpSrc);
const aboutContact = splitPages(aboutContactSrc);
const communityEtc = splitPages(communityEtcSrc);

/**
 * Tab id → { en, ar, body }. ar labels match the footer wording.
 * body may be '' when the docs export has no section for the page (terms).
 */
export const SITE_PAGES = {
  privacy:   { en: 'Privacy Policy',    ar: 'سياسة الخصوصية',     body: prepare(privacyCookie['Privacy Policy']) },
  terms:     { en: 'Terms of Service',  ar: 'شروط الخدمة',        body: '' },
  cookies:   { en: 'Cookie Policy',     ar: 'سياسة الكوكيز',      body: prepare(privacyCookie['Cookie Policy']) },
  faq:       { en: 'FAQ',               ar: 'الأسئلة الشائعة',    body: prepare(faqHelp['FAQ']) },
  help:      { en: 'Help Center',       ar: 'مركز المساعدة',      body: prepare(faqHelp['Help Center']) },
  about:     { en: 'About us',          ar: 'من نحن',             body: prepare(aboutContact['About Us']) },
  contact:   { en: 'Contact us',        ar: 'اتصل بنا',           body: prepare(aboutContact['Contact Us']) },
  community: { en: 'Community',         ar: 'المجتمع',            body: prepare(communityEtc['Community']) },
  premium:   { en: 'Premium',           ar: 'Premium',            body: prepare(communityEtc['Premium']) },
  report:    { en: 'Report a problem',  ar: 'الإبلاغ عن مشكلة',   body: prepare(communityEtc['Report a Problem']) },
};
