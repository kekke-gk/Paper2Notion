import { xmlToJson } from './utils.js';

class arXiv {
  static isMatch(url) {
    return this.isMatchAbs(url) || this.isMatchPDF(url);
  }

  static isMatchAbs(url) {
    const regex = /^https:\/\/(www\.)?arxiv\.org\/abs\//gs;
    return regex.exec(url) !== null;
  }

  static isMatchPDF(url) {
    const regex = /^https:\/\/(www\.)?arxiv\.org\/pdf\//gs;
    return regex.exec(url) !== null;
  }

  static getID(url) {
    const regex = /\d+\.\d+/gs;
    return regex.exec(url)[0];
  }

  static conv2abs(url) {
    const id = this.getID(url);
    return `https://arxiv.org/abs/${id}`;
  }

  static id2abs(id) {
    return `https://arxiv.org/abs/${id}`;
  }

  static id2pdf(id) {
    return `https://arxiv.org/pdf/${id}`;
  }

  static async getPaperInfo(url) {
    const paperID = this.getID(url);
    const apiURL = `https://export.arxiv.org/api/query?id_list=${paperID}`;
    const request = new Request(apiURL);

    const response = await fetch(request);
    const xml = await response.text();
    const json = xmlToJson(xml);
    console.log('ArXiv response: ', json);
    const paperInfo = {
      title: json.title[0],
      publishedDate: json.published[0],
      abstractURL: this.id2abs(paperID),
      arXivURL: this.id2abs(paperID),
      arXivID: paperID,
      pdfURL: this.id2pdf(paperID),
      venue: '197a562d96cc80e0b8dbd6b5c2287f04', // The ID for ArXiv in my Notion
    };
    return paperInfo;
  }
}

class SemanticScholar {
  static isMatch(url) {
    const regex = /^https:\/\/www\.semanticscholar\.org\/paper\//gs;
    return regex.exec(url) !== null;
  }

  static getID(url) {
    const regex = /^https:\/\/www\.semanticscholar\.org\/paper\/.*\/(.*)$/gs;
    return regex.exec(url)[1];
  }

  static async getPaperInfo(url) {
    const paperID = this.getID(url);
    const apiURL = `https://api.semanticscholar.org/v1/paper/${paperID}`;
    const request = new Request(apiURL);

    const response = await fetch(request);
    const json = await response.json();
    console.log('Semantic Scholar API response: ', json);
    let paperInfo = {
      title: json.title,
      publishedDate: new Date(json.year, 0, 1),
      semanticScholarURL: json.url,
      semanticScholarID: paperID,
      numCited: json.numCitedBy,
    };

    if (json.arxivId) {
      const id = json.arxivId;
      paperInfo = {
        ...paperInfo,
        arXivID: id,
        arXivURL: arXiv.id2abs(id),
        abstractURL: arXiv.id2abs(id),
        pdfURL: arXiv.id2pdf(id),
        venue: '197a562d96cc80e0b8dbd6b5c2287f04', // The ID for ArXiv in my Notion
      }
    }
    return paperInfo;
  }
}

class MIRU25 {
  static isMatch(url) {
    return this.isMatchAbs(url) || this.isMatchPDF(url);
  }

  static isMatchAbs(url) {
    const regex = /paper_.*?\.html/gs;
    return regex.exec(url) !== null;
  }

  static isMatchPDF(url) {
    const regex = /.*?\.pdf/gs;
    return regex.exec(url) !== null;
  }

  static getID(url) {
    const regex = /.*\/(paper_)?(.*?)(\.pdf|\.html)$/gs;
    return regex.exec(url)[2];
  }

  static conv2abs(url) {
    const id = this.getID(url);
    return this.id2abs(id);
  }

  static id2abs(id) {
    return `paper_${id}.html`;
  }

  static id2pdf(id) {
    return `${id}.pdf`;
  }
  
  static getPageContentFromActiveTab() {
    // 現在のウィンドウでアクティブなタブを取得
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.warn("アクティブなタブが見つかりません");
        return;
      }

      const tabId = tabs[0].id;

      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          const title = document.getElementsByTagName("h2")[0].innerText;
          return { title };
        }
      }, (results) => {
        if (chrome.runtime.lastError) {
          console.error("スクリプト実行エラー:", chrome.runtime.lastError);
          return;
        }

        if (results && results[0] && results[0].result) {
          const { title } = results[0].result;
          console.log("タイトル:", title);
          return title;
        }
      });
    });
  }
  
  static getPageContentFromActiveTab2() {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
          return reject("アクティブなタブが見つかりません");
        }

        const tabId = tabs[0].id;

        chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: () => {
            const title = document.getElementsByTagName("h2")[0].innerText;
            return { title };
          }
        }, (results) => {
          if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError.message);
          }

          if (results && results[0] && results[0].result) {
            resolve(results[0].result);  // ← これが戻り値のように扱える
          } else {
            reject("スクリプトの結果が不正です");
          }
        });
      });
    });
  }



  static async getPaperInfo(url) {
    const paperID = this.getID(url);

    // const title = this.getPageContentFromActiveTab();
    const info = await this.getPageContentFromActiveTab2();
    const firstSpaceIndex = info["title"].indexOf(" ");
    const title = info["title"].slice(firstSpaceIndex + 1);

    // let title;
    
    // chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    //   if (message.type === "PAGE_CONTENT") {
    //     console.log("タイトル:", message.title);
    //     title = message.title;
    //   }
    // });

    const paperInfo = {
      title: title,
      publishedDate: '2025-07-29',
      abstractURL: this.id2abs(paperID),
      pdfURL: this.id2pdf(paperID),
      venue: '21ca562d96cc80c199e9fe23b33d13db', // The ID for MIRU'25 in my Notion
      metaStr: paperID,
    };
    return paperInfo;
  }
}

export const sites = [arXiv, SemanticScholar, MIRU25];
