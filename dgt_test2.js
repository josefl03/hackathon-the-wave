const puppeteer = require('./zaragoza/node_modules/puppeteer');

(async () => {
  console.log("Starting Chrome...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  let cameras = [];
  try {
    await page.goto('https://www.dgt.es/conoce-el-estado-del-trafico/camaras-de-trafico/?pag=1&prov=50&carr=', {waitUntil: 'networkidle0', timeout: 15000});
    // The page renders templates. We want to extract .fs-16 imgs or similar that contain the actual DGT jpg urls.
    cameras = await page.evaluate(() => {
       const rows = Array.from(document.querySelectorAll('ul.list-resultados li, .camara-item')); // Not exact selector, let's just get all images
       const imgs = Array.from(document.querySelectorAll('img[src*="infocar.dgt.es"], img[src*="camara"]')).map(i => i.src);
       
       // Alternatively, extract the specific template items
       return {
         imgs: imgs,
         html: document.body.innerHTML.substring(0, 500)
       };
    });
  } catch (e) { console.error(e); }
  console.log(cameras);
  await browser.close();
})();
