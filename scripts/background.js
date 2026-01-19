const RES_FLAG = 'Hen3uTHua';

function extractMessageFromHTMLResponse(htmlText) {
  const regex = new RegExp(`${RES_FLAG}(.*?)${RES_FLAG}`, 'g');
  const results = [...htmlText.matchAll(regex)].map(m => m[1]);
  return results[0] || null;
}

function getToastArgsFromMessage(message) {
  if (!message) {
    return {
      text: chrome.i18n.getMessage('toastGetPaperInfoFailed'),
      type: "failure"
    };
  }
  
  switch (message) {
    case 'wrong_key':
      return {
        text: chrome.i18n.getMessage('toastGetPaperInfoFailed'),
        type: "failure"
      };
    case 'updated':
      return {
        text: chrome.i18n.getMessage('toastUpdated'),
        type: "success"
      };
    case 'created':
      return {
        text: chrome.i18n.getMessage('toastSuccess'),
        type: "success"
      };
  }

  return {
    text: chrome.i18n.getMessage('toastGetPaperInfoFailed'),
    type: "failure"
  };
}

async function clickHandler(tab) {
  const apiURL = `https://script.google.com/macros/s/AKfycbxL46zF5vS8QOlmvdixkab88kDuZTJsUT_9UBNUrHNz/dev?key=qbN9qAA8Jxw4&paperurl=${encodeURIComponent(tab.url)}`;
  showToastOnTab(tab.id, {
    text: chrome.i18n.getMessage('toastStartGetPaperInfo'),
    type: "running",
  });
  const response = await fetch(apiURL, {
    method: 'POST',
    body: JSON.stringify({
      paperurl: tab.url,
    }),
  });
  
  const resText = await response.text();
  const message = extractMessageFromHTMLResponse(resText);
  const toastArgs = getToastArgsFromMessage(message);
  showToastOnTab(tab.id, toastArgs);
}

chrome.action.onClicked.addListener(clickHandler);

function setIcon(url) {
  chrome.action.setIcon({ path: '../images/icon128.png' });
  // chrome.action.setIcon({ path: '../images/icon128_inactive.png' });
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
      toast.style.background = type === "success" ? "#16a34a" : type === "failure" ? "#dc2626" : "#888888";
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

