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

export const sites = [arXiv, SemanticScholar];
