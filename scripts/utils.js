export function xmlToJson(xmlString) {
  const jsonDict = {};
  xmlString.replace(/<(\w+)>([^<]+)<\/\1>/g, (_, tag, value) => {
      if (!jsonDict[tag]) {
          jsonDict[tag] = [];
      }
      jsonDict[tag].push(value);
  });
  return jsonDict;
}
