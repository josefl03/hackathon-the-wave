const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('https://www.dgt.es/conoce-el-estado-del-trafico/camaras-de-trafico/?pag=1&prov=50&carr=', {waitUntil: 'networkidle2'});
  
  const cameras = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.camara-item, .card, img[src*="camara"]')).map(el => el.outerHTML);
  });
  console.log("Found:", cameras.length);
  // Let's just dump the HTML of the main container to inspect it
  const html = await page.evaluate(() => {
    return document.querySelector('#camarasTabla, .camaras-list, article, main')?.innerHTML || document.body.innerHTML;
  });
  const fs = require('fs');
  fs.writeFileSync('dgt_rendered.html', html);
  
  await browser.close();
})();
