const puppeteer = require('./zaragoza/node_modules/puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: "new", args: ['--no-sandbox']});
  const page = await browser.newPage();
  page.on('response', response => {
    if (response.url().includes('json') || response.url().includes('api')) {
      console.log('API Hit:', response.url());
    }
  });
  await page.goto('https://www.dgt.es/conoce-el-estado-del-trafico/camaras-de-trafico/?pag=1&prov=50&carr=', {waitUntil: 'networkidle0'});
  await browser.close();
})();
