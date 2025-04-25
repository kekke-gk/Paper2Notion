import { alreadyExists, createNotionPage } from './notion.js';
import { sites } from './sites.js';

async function fetchPaperAndCreateNotionPage(url) {
  for (const site of sites) {
    if (!site.isMatch(url)) continue;

    console.log('Matched: ', site.name);

    const paperInfo = await site.getPaperInfo(url);

    console.log('Check if a page already exists: ', paperInfo);
    if (await alreadyExists(paperInfo, site)) {
      console.log('Already exists page: ', paperInfo);
      return;
    }

    console.log('Try to create page: ', paperInfo);
    await createNotionPage(paperInfo);

    return;
  }

  console.log('Unmatched: ', url);
}

function clickHandler(tab) {
  fetchPaperAndCreateNotionPage(tab.url);
}

chrome.action.onClicked.addListener(clickHandler);

function setIcon(url) {
  for (const site of sites) {
    if (site.isMatch(url)) {
      chrome.action.setIcon({ path: '../images/icon128.png' });
      return;
    }
  }
  chrome.action.setIcon({ path: '../images/icon128_inactive.png' });
}

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    let url = tabs[0].url;
    setIcon(url);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const url = tab.url;
  setIcon(url);
});

chrome.contextMenus.create({
  title: chrome.i18n.getMessage('contextMenuTitle'),
  id: 'paper2notion',
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('Clicked context menu');
  clickHandler(tab);
});
