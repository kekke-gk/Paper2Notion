import { xmlToJson } from './utils.js';
import { SEMANTIC_SCHOLAR_API_KEY } from './keys.js';

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
      title: json.title[1],
      publishedDate: json.published[0],
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
    console.log('Try to get PaperInfo from SemanticScholar: ', url);
    const paperID = this.getID(url);
    console.log('Paper ID: ', paperID);
    const apiURL = `https://api.semanticscholar.org/graph/v1/paper/${paperID}?fields=title,citationCount,url,externalIds,openAccessPdf,publicationDate`;
    const request = new Request(apiURL, {
      headers: {
        'x-api-key': SEMANTIC_SCHOLAR_API_KEY
      }
    });

    const response = await fetch(request);
    const json = await response.json();
    console.log('Semantic Scholar API response: ', json);
    let paperInfo = {
      title: json.title,
      publishedDate: json.publicationDate || new Date(json.year, 0, 1),
      semanticScholarURL: json.url,
      semanticScholarID: paperID,
      numCited: json.citationCount,
    };

    if (json.externalIds.ArXiv) {
      const id = json.externalIds.ArXiv;
      paperInfo = {
        ...paperInfo,
        arXivID: id,
        arXivURL: arXiv.id2abs(id),
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

class CVF {
  static isMatch(url) {
    return this.isMatchHTML(url) || this.isMatchPDF(url) || this.isMatchSupplemental(url);
  }

  // https://openaccess.thecvf.com/content/CVPR2025/html/Tang_Missing_Target-Relevant_Information_Prediction_with_World_Model_for_Accurate_Zero-Shot_CVPR_2025_paper.html
  // https://openaccess.thecvf.com/content/ICCV2021/html/Shi_AdaSGN_Adapting_Joint_Number_and_Model_Size_for_Efficient_Skeleton-Based_ICCV_2021_paper.html
  static isMatchHTML(url) {
    const regex = /^https:\/\/openaccess\.thecvf\.com\/content\/[A-Z]+\d{4}\/html\//gs;
    return regex.exec(url) !== null;
  }

  // https://openaccess.thecvf.com/content/CVPR2025/papers/Tang_Missing_Target-Relevant_Information_Prediction_with_World_Model_for_Accurate_Zero-Shot_CVPR_2025_paper.pdf
  // https://openaccess.thecvf.com/content/ICCV2021/papers/Shi_AdaSGN_Adapting_Joint_Number_and_Model_Size_for_Efficient_Skeleton-Based_ICCV_2021_paper.pdf
  static isMatchPDF(url) {
    const regex = /^https:\/\/openaccess\.thecvf\.com\/content\/[A-Z]+\d{4}\/papers\//gs;
    return regex.exec(url) !== null;
  }

  // https://openaccess.thecvf.com/content/ICCV2021/supplemental/Shi_AdaSGN_Adapting_Joint_ICCV_2021_supplemental.pdf
  static isMatchSupplemental(url) {
    const regex = /^https:\/\/openaccess\.thecvf\.com\/content\/[A-Z]+\d{4}\/supplemental\//gs;
    return regex.exec(url) !== null;
  }

  static getConferenceAndYear(url) {
    const regex = /\/content\/([A-Z]+\d{4})\//gs;
    const match = regex.exec(url);
    return match ? match[1] : null;
  }

  static getPaperID(url) {
    if (this.isMatchHTML(url)) {
      const regex = /\/html\/(.+)_paper\.html$/gs;
      const match = regex.exec(url);
      return match ? match[1] : null;
    } else if (this.isMatchPDF(url)) {
      const regex = /\/papers\/(.+)_paper\.pdf$/gs;
      const match = regex.exec(url);
      return match ? match[1] : null;
    } else if (this.isMatchSupplemental(url)) {
      const regex = /\/supplemental\/(.+)_supplemental\.pdf$/gs;
      const match = regex.exec(url);
      return match ? match[1] : null;
    }
    return null;
  }

  static conv2html(url) {
    const conferenceYear = this.getConferenceAndYear(url);
    const paperID = this.getPaperID(url);
    return `https://openaccess.thecvf.com/content/${conferenceYear}/html/${paperID}_paper.html`;
  }

  static id2html(conferenceYear, paperID) {
    return `https://openaccess.thecvf.com/content/${conferenceYear}/html/${paperID}_paper.html`;
  }

  static id2pdf(conferenceYear, paperID) {
    return `https://openaccess.thecvf.com/content/${conferenceYear}/papers/${paperID}_paper.pdf`;
  }

  static id2supplemental(conferenceYear, paperID) {
    return `https://openaccess.thecvf.com/content/${conferenceYear}/supplemental/${paperID}_supplemental.pdf`;
  }


  static extractTitleFromPaperID(paperID) {
    // CVF paper IDs contain the title information
    // Example: "Tang_Missing_Target-Relevant_Information_Prediction_with_World_Model_for_Accurate_Zero-Shot_CVPR_2025"
    const parts = paperID.split('_');
    if (parts.length < 2) return paperID;
    
    // Remove the first part (author name) and last two parts (conference_year)
    const titleParts = parts.slice(1, -2); // Remove author, conference, year
    return titleParts.join(' ').replace(/-/g, ' ');
  }

  static getPageContentFromActiveTab() {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
          return reject("アクティブなタブが見つかりません");
        }

        const tabId = tabs[0].id;

        chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: () => {
            // CVF papers have the title in an div tag with id="papertitle"
            const titleElement = document.getElementById("papertitle");
            const title = titleElement ? titleElement.innerText.trim() : "";
            
            // Check for supplemental link
            const suppLinks = Array.from(document.querySelectorAll('a')).filter(
              link => link.innerText.toLowerCase().includes('supp')
            );
            const hasSupplemental = suppLinks.length > 0;
            const supplementalURL = hasSupplemental ? suppLinks[0].href : null;
            
            return { title, hasSupplemental, supplementalURL };
          }
        }, (results) => {
          if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError.message);
          }

          if (results && results[0] && results[0].result) {
            resolve(results[0].result);
          } else {
            reject("スクリプトの結果が不正です");
          }
        });
      });
    });
  }

  static async getPaperInfo(url) {
    const conferenceYear = this.getConferenceAndYear(url);
    const paperID = this.getPaperID(url);

    let title, hasSupplemental = false, supplementalURL = null;
    try {
      const info = await this.getPageContentFromActiveTab();
      title = info.title || this.extractTitleFromPaperID(paperID);
      hasSupplemental = info.hasSupplemental;
      supplementalURL = info.supplementalURL;
    } catch (error) {
      console.log('Could not extract content from page, using paper ID:', error);
      title = this.extractTitleFromPaperID(paperID);
    }

    // Determine venue ID based on conference
    const venueIDs = {
      'CVPR2025': '1d6a562d96cc809ca3aeff4fe3cf71a5',
      'CVPR2024': '1faa562d96cc80f588b6c302e52b6615',
      'CVPR2023': '254a562d96cc8012ba85e5553924454d',
      'CVPR2022': '1d5a562d96cc80d18f96e101219b84b1',
      'CVPR2021': '1cba562d96cc80c6b648ee6ed1f93c15',
      'CVPR2020': '1cba562d96cc80d5bb7dce0ae3a251e5',
      'CVPR2019': '223a562d96cc8036a4f1de35607730d5',

      'ICCV2023': '1cba562d96cc80028bcacdff662848bd',
      'ICCV2021': '1cba562d96cc802b83d5d4ca905069df',

      'WACV2025': '1d5a562d96cc80f59d90ed8bf82baf11',
      'WACV2024': '1d3a562d96cc80968affd52ed8e2b49f',
    }
    const venueId = venueIDs[conferenceYear];

    const paperInfo = {
      title: title,
      publishedDate: `${conferenceYear.slice(-4)}-01-01`, // Extract year from conference
      abstractURL: this.id2html(conferenceYear, paperID),
      pdfURL: this.id2pdf(conferenceYear, paperID),
      venue: venueId,
    };

    // Add supplemental URL if it exists on the page
    if (hasSupplemental && supplementalURL) {
      paperInfo.supplemental = supplementalURL;
    }

    return paperInfo;
  }
}

export const sites = [arXiv, SemanticScholar, MIRU25, CVF];
