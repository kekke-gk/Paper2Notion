import { alreadyExists, createNotionPage } from './notion.js';
import { sites } from './sites.js';

async function fetchPaperAndCreateNotionPage(url) {
  for (const site of sites) {
    if (!site.isMatch(url)) continue;

    console.log('Matched: ', site.name);

    let paperInfo;
    try {
      paperInfo = await site.getPaperInfo(url);
    } catch (e) {
      console.error('Error fetching paper info: ', e);
      return 'toastGetPaperInfoFailed';
    }

    try {
      console.log('Check if a page already exists: ', paperInfo);
      if (await alreadyExists(paperInfo, site)) {
        console.log('Already exists page: ', paperInfo);
        return 'toastAlreadyExists';
      }

      console.log('Try to create page: ', paperInfo);
      await createNotionPage(paperInfo);
    } catch (e) {
      console.error('Error creating Notion page: ', e);
      return 'toastAccessNotionFailed';
    }

    return 'toastSuccess';
  }

  console.log('Unmatched: ', url);
  return 'toastUnsupportedSite';
}

async function clickHandler(tab) {
  const result = await fetchPaperAndCreateNotionPage(tab.url);
  const toastArgs = {
    text: chrome.i18n.getMessage(result),
    type: result === 'toastSuccess' ? "success" : "failure"
  };
  showToastOnTab(tab.id, toastArgs);
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

async function showToastOnTab(tabId, { text, type = "success", duration = 3000 }) {
  await chrome.scripting.executeScript({
    target: { tabId },
    // ここで実行される関数はページのDOMを直接触れます
    func: (text, type, duration) => {
      // 既存のトーストコンテナがなければ作成
      let container = document.getElementById("__ext_toast_container__");
      if (!container) {
        container = document.createElement("div");
        container.id = "__ext_toast_container__";
        container.style.position = "fixed";
        container.style.top = "20px";
        container.style.right = "20px";
        container.style.zIndex = "2147483647";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.gap = "8px";
        document.documentElement.appendChild(container);
      }

      // トースト本体
      const toast = document.createElement("div");
      toast.textContent = text;

      // スタイル（インラインで完結）
      toast.style.padding = "10px 14px";
      toast.style.borderRadius = "10px";
      toast.style.color = "#fff";
      toast.style.fontFamily = "system-ui, sans-serif";
      toast.style.fontSize = "14px";
      toast.style.boxShadow = "0 6px 16px rgba(0,0,0,.2)";
      toast.style.background = type === "success" ? "#16a34a" : "#dc2626";
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-6px)";
      toast.style.transition = "opacity .18s ease, transform .18s ease";

      container.appendChild(toast);

      // フェードイン
      requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
      });

      // 指定時間後にフェードアウトして削除
      setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-6px)";
        toast.addEventListener("transitionend", () => {
          toast.remove();
          if (!container.childElementCount) container.remove();
        }, { once: true });
      }, Math.max(800, duration || 3000));
    },
    args: [text, type, duration]
  });
}

