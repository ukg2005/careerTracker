/**
 * content.js
 * Scrapes job details from the current page (LinkedIn, Indeed, Glassdoor, Naukri).
 * Responds to messages from popup.js with the extracted data.
 */

function scrapeLinkedIn() {
    const title =
        document.querySelector('.job-details-jobs-unified-top-card__job-title h1')?.innerText?.trim() ||
        document.querySelector('.jobs-unified-top-card__job-title h1')?.innerText?.trim() ||
        document.querySelector('h1.topcard__title')?.innerText?.trim() ||
        '';

    const company =
        document.querySelector('.job-details-jobs-unified-top-card__company-name a')?.innerText?.trim() ||
        document.querySelector('.jobs-unified-top-card__company-name a')?.innerText?.trim() ||
        document.querySelector('.topcard__org-name-link')?.innerText?.trim() ||
        '';

    const location =
        document.querySelector('.job-details-jobs-unified-top-card__bullet')?.innerText?.trim() ||
        document.querySelector('.jobs-unified-top-card__bullet')?.innerText?.trim() ||
        document.querySelector('.topcard__flavor--bullet')?.innerText?.trim() ||
        '';

    const description =
        document.querySelector('.jobs-description__content')?.innerText?.trim() ||
        document.querySelector('.description__text')?.innerText?.trim() ||
        '';

    return { title, company, location, description, url: window.location.href, source: 'LinkedIn' };
}

function scrapeIndeed() {
    const title =
        document.querySelector('h1[data-testid="jobsearch-JobInfoHeader-title"] span')?.innerText?.trim() ||
        document.querySelector('h1.jobsearch-JobInfoHeader-title')?.innerText?.trim() ||
        '';

    const company =
        document.querySelector('[data-testid="inlineHeader-companyName"] a')?.innerText?.trim() ||
        document.querySelector('[data-company-name]')?.innerText?.trim() ||
        document.querySelector('.jobsearch-InlineCompanyRating-companyName')?.innerText?.trim() ||
        '';

    const location =
        document.querySelector('[data-testid="job-location"]')?.innerText?.trim() ||
        document.querySelector('[data-testid="inlineHeader-companyLocation"]')?.innerText?.trim() ||
        '';

    const description =
        document.querySelector('#jobDescriptionText')?.innerText?.trim() ||
        document.querySelector('.jobsearch-jobDescriptionText')?.innerText?.trim() ||
        '';

    return { title, company, location, description, url: window.location.href, source: 'Indeed' };
}

function scrapeGlassdoor() {
    const title =
        document.querySelector('[data-test="job-title"]')?.innerText?.trim() ||
        document.querySelector('h1[data-test="jobTitle"]')?.innerText?.trim() ||
        '';

    const company =
        document.querySelector('[data-test="employer-name"]')?.innerText?.trim() ||
        document.querySelector('.EmployerProfile_profileContainer__63w3R span')?.innerText?.trim() ||
        '';

    const location =
        document.querySelector('[data-test="location"]')?.innerText?.trim() ||
        '';

    const description =
        document.querySelector('[class*="JobDetails_jobDescription"]')?.innerText?.trim() ||
        document.querySelector('.desc')?.innerText?.trim() ||
        '';

    return { title, company, location, description, url: window.location.href, source: 'Glassdoor' };
}

function scrapeNaukri() {
    const title =
        document.querySelector('h1.styles_jd-header-title__rZwM1')?.innerText?.trim() ||
        document.querySelector('h1.jd-header-title')?.innerText?.trim() ||
        document.querySelector('[class*="jd-header-title"]')?.innerText?.trim() ||
        '';

    const company =
        document.querySelector('.jd-header-comp-name a')?.innerText?.trim() ||
        document.querySelector('[class*="jd-header-comp-name"]')?.innerText?.trim() ||
        '';

    const location =
        document.querySelector('.location-details li')?.innerText?.trim() ||
        document.querySelector('[class*="location"]')?.innerText?.trim() ||
        '';

    const description =
        document.querySelector('.job-desc')?.innerText?.trim() ||
        document.querySelector('[class*="job-desc"]')?.innerText?.trim() ||
        '';

    return { title, company, location, description, url: window.location.href, source: 'Naukri' };
}

function scrapeJobData() {
    const host = window.location.hostname;

    if (host.includes('linkedin.com')) return scrapeLinkedIn();
    if (host.includes('indeed.com')) return scrapeIndeed();
    if (host.includes('glassdoor.com')) return scrapeGlassdoor();
    if (host.includes('naukri.com')) return scrapeNaukri();

    // Generic fallback: try Open Graph meta tags
    return {
        title: document.querySelector('meta[property="og:title"]')?.getAttribute('content') || document.title || '',
        company: '',
        location: '',
        description: document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '',
        url: window.location.href,
        source: window.location.hostname,
    };
}

// Listen for requests from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'GET_JOB_DATA') {
        sendResponse(scrapeJobData());
    }
    return true; // Keep channel open for async
});
