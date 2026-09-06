async (page) => {
  const results = [];
  for (const [width, height] of [[320,568],[390,844],[430,932],[680,800],[768,1024],[900,700],[844,390],[1440,1000]]) {
    await page.setViewportSize({width,height});
    await page.locator('.catalogue-logo').first().waitFor({state: width > 900 ? 'hidden' : 'visible'});
    const geometry = await page.evaluate(() => {
      const rect = s => {const e=document.querySelector(s); const r=e.getBoundingClientRect(); return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth};};
      return {width:innerWidth, viewportHeight:innerHeight, documentWidth:document.documentElement.scrollWidth, documentHeight:document.documentElement.scrollHeight, header:rect('.catalogue-header'), logo:rect('.catalogue-logo'), rail:rect('.catalogue-categories'), content:rect('.catalogue-content'), heading:rect('.catalogue-heading'), first:rect('.catalogue-product--browse'), nav:rect('.mobile-tab-bar')};
    });
    if (geometry.documentWidth > width || geometry.first.x < geometry.rail.right - 1 || geometry.content.scrollWidth > geometry.content.clientWidth + 1) throw new Error(JSON.stringify(geometry));
    if (width <= 900 && (geometry.content.y < geometry.header.bottom - 1 || geometry.documentHeight > height + 1 || Math.abs(geometry.logo.x + geometry.logo.width / 2 - width / 2)>1)) throw new Error(JSON.stringify(geometry));
    if (width <= 680 && geometry.content.bottom > geometry.nav.y+1) throw new Error(JSON.stringify(geometry));
    if (width === 390 || width === 768 || width === 1440) await page.screenshot({path:`output/playwright/menu-${width}.png`});
    results.push({width, height, railWidth:geometry.rail.width, firstProductWidth:geometry.first.width, contentHeight:geometry.content.height});
  }
  return results;
}
