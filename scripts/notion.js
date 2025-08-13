import { NOTION_API_KEY, NOTION_DATABASE_ID } from './keys.js';

const HEADER = {
  'Authorization': `Bearer ${NOTION_API_KEY}`,
  'Content-Type': 'application/json',
  'Notion-Version': '2022-06-28',
};

function tryAssignProperty(properties, paperInfo, key) {
  function value2dict(type, value) {
    switch (type) {
      case PropertyType.URL:
        return { url: value };
      case PropertyType.TEXT:
        return { rich_text: [{ text: { content: value } }] };
      case PropertyType.DATE:
        return { date: { start: value } };
      case PropertyType.RELATION:
        return { relation: [{ id: value }] };
      case PropertyType.NUMBER:
        return { number: value };
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }

  if (paperInfo[key]) {
    const { type, name } = MyProperties[key];
    properties[name] = value2dict(type, paperInfo[key]);
  }
}

function paperInfo2Properties(paperInfo) {
  let properties = {
    Name: {
      title: [
        {
          text: {
            content: paperInfo.title,
          },
        },
      ],
    },
  };

  for (const key in MyProperties) {
    tryAssignProperty(properties, paperInfo, key);
  }

  return properties;
}

export async function createNotionPage(paperInfo) {
  const body = {
    parent: { database_id: NOTION_DATABASE_ID },
    properties: paperInfo2Properties(paperInfo),
  };

  await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: HEADER,
    body: JSON.stringify(body),
  })
    .then((response) => {
      if (!response.ok) {
        console.log('Error: ', response);
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((json) => {
      console.log('Success:', json);
    });
}

export async function alreadyExists(paperInfo, site) {
  const body = {
    filter: {
      property: MyProperties.title.name,
      rich_text: {
        equals: paperInfo.title,
      },
    },
  };

  const apiURL = `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`;

  const json = await fetch(apiURL, {
    method: 'POST',
    headers: HEADER,
    body: JSON.stringify(body),
  })
    .then((response) => {
      if (!response.ok) {
        console.log('Error: ', response);
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((json) => {
      console.log('Success:', json);
      return json;
    });

  if (json.results && json.results.length > 0) {
    return true;
  }

  return false;
}

const PropertyType = {
  URL: 'url',
  TEXT: 'text',
  DATE: 'date',
  RELATION: 'relation',
  NUMBER: 'number',
};

const MyProperties = {
  title: {
    type: PropertyType.TEXT,
    name: 'Full Title',
  },
  publishedDate: {
    type: PropertyType.DATE,
    name: 'Date Published',
  },
  abstractURL: {
    type: PropertyType.URL,
    name: 'Abstract Page',
  },
  arXivURL: {
    type: PropertyType.URL,
    name: 'ArXiv',
  },
  arXivID: {
    type: PropertyType.TEXT,
    name: 'ArXiv ID',
  },
  semanticScholarURL: {
    type: PropertyType.URL,
    name: 'SemanticScholar',
  },
  semanticScholarID: {
    type: PropertyType.TEXT,
    name: 'SemanticScholar ID',
  },
  pdfURL: {
    type: PropertyType.URL,
    name: 'PDF Link',
  },
  venue: {
    type: PropertyType.RELATION,
    name: 'Venue',
  },
  numCited: {
    type: PropertyType.NUMBER,
    name: 'Cited',
  },
  metaStr: {
    type: PropertyType.TEXT,
    name: 'Metastr',
  },
};
