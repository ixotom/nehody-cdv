// Axios - Promise based HTTP client for the browser and node.js (Read more at https://axios-http.com/docs/intro).
import axios from 'axios';
// Cheerio - The fast, flexible & elegant library for parsing and manipulating HTML and XML (Read more at https://cheerio.js.org/).
import * as cheerio from 'cheerio';
// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/).
import { Actor } from 'apify';

// this is ESM project, and as such, it requires you to specify extensions in your relative imports
// read more about this here: https://nodejs.org/docs/latest-v18.x/api/esm.html#mandatory-file-extensions
// note that we need to use `.js` even when inside TS files
// import { router } from './routes.js';

// The init() call configures the Actor for its environment. It's recommended to start every Actor with an init().
await Actor.init();

interface Input {
  vehicle: string;
  dateFrom: Date;
  dateTo: Date;
}

const readTable = (html: string): {[k: string]: {}} => {
  const $ = cheerio.load(html);
  const data:  {[k: string]: string} = {};
  $('table > tbody > tr').each((_: any, element: any) => {
    const row = $(element).find('td').map((_: any, el: any) => $(el).text()).get();
    data[row[0] as string] = row[1];
    data[row[2] as string] = row[3];
  });
  return data;
}

const getSections = (html: string) => {
  const $ = cheerio.load(html);
  const data:  string[] = [];
  $('a').each((_: any, element: any) => {
    const href = $(element).attr('href');
    if (href!== undefined) {
      data.push(href)
    }
  });
  return data;
}


// Structure of input is defined in input_schema.json
const input = await Actor.getInput<Input>();
if (!input) throw new Error("Input is missing!");
const { dateFrom, dateTo, vehicle } = input;

let resp_ids =
    await fetch("https://nehody.cdv.cz/handlers/loadMap.php", {
      "headers": {
        "accept": "application/json, text/javascript, */*; q=0.01",
        "accept-language": "cs,en;q=0.9,en-US;q=0.8,es;q=0.7,de;q=0.6,ru;q=0.5,sk;q=0.4,pl;q=0.3",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest"
      },
      "referrer": "https://nehody.cdv.cz/statistics.php",
      "referrerPolicy": "no-referrer-when-downgrade",
      "body": `span=day&dateFrom=${dateFrom}&dateTo=${dateTo}&types%5B%5D=nehody&conditions%5Bselect%5D%5B0%5D%5Bname%5D%5Bval%5D=p44&conditions%5Bselect%5D%5B0%5D%5Bcoder%5D%5Bval%5D=${vehicle}&extent%5Bnortheast%5D%5Blat%5D=51&extent%5Bnortheast%5D%5Blng%5D=19&extent%5Bsouthwest%5D%5Blat%5D=48.5&extent%5Bsouthwest%5D%5Blng%5D=11.5&zoom=10&layers%5BaccidentType%5D=accidents-injury&layers%5BaccidentDetail%5D%5B%5D=accidents-injury-death&layers%5BaccidentDetail%5D%5B%5D=accidents-injury-heavy&layers%5BaccidentDetail%5D%5B%5D=accidents-injury-light&layers%5BaccidentDetail%5D%5B%5D=accidents-injury-no`,
      "method": "POST",
      "mode": "cors",
      "credentials": "include"
    });

let json = await resp_ids.json();
let ids = json.data.map((d: {p1: number}) => d.p1);

console.log('Amount of accidents', ids.length);

for(let id of ids) {
  console.log('id', id);
  const response = await axios.get(`https://nehody.cdv.cz/detail.php?p1=${id}`);
  const $ = cheerio.load(response.data);
  let sections: string[] = [];

  const data: {[k: string]: {[k: string]: {} | string}} = {};


  const firstDiv = $('#participants')
  const html = firstDiv.html()
  if (html!==null){
    sections = getSections(html)
  }

  const secondDiv = firstDiv.next();
  const secondDivHtml = secondDiv.html();
  if (secondDivHtml!==null){
    data.info = readTable(secondDivHtml);
  }

  const fourthDiv = secondDiv.next().next();
  const fourthDivHtml = fourthDiv.html();
  if (fourthDivHtml!==null){
    data.accidentDetail = readTable(fourthDivHtml);
  }

  let lastIndex = 0;
  for (let [index, section] of sections.entries()) {
    const sectionDiv = $(`${section}`);
    const subHtml = sectionDiv.html();
    if (subHtml!==null){
      if (!sectionDiv.hasClass('nasledek')){
        lastIndex = index;
        data[section.slice(1)] = readTable(subHtml)
      } else {
        data[sections[lastIndex].slice(1)][section.slice(1)] = readTable(subHtml)
      }
    }
  }
  await Actor.pushData({data: data});
}
await Actor.exit();
