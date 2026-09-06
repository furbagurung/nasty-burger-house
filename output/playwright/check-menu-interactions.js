async (page) => {
  await page.goto('http://localhost:3010/menu/burgers');
  await page.setViewportSize({width:320,height:568});
  const categories=page.locator('.catalogue-categories');
  await page.locator('.catalogue-product--browse').last().scrollIntoViewIfNeeded();
  const scrolled=await page.locator('.catalogue-content').evaluate(el=>({scrollTop:el.scrollTop,railScroll:document.querySelector('.catalogue-categories').scrollTop,heading:document.querySelector('.catalogue-heading').getBoundingClientRect().top,header:document.querySelector('.catalogue-header').getBoundingClientRect().bottom,lastBottom:el.querySelector('.catalogue-product--browse:last-child').getBoundingClientRect().bottom,navTop:document.querySelector('.mobile-tab-bar').getBoundingClientRect().top}));
  if(scrolled.scrollTop<=0 || scrolled.lastBottom>scrolled.navTop || Math.abs(scrolled.heading-scrolled.header)>1) throw new Error(JSON.stringify(scrolled));
  const links = await categories.locator('a').evaluateAll(els=>els.map(el=>({href:el.getAttribute('href'),label:el.textContent.trim()})));
  for(const {href,label} of links) {
    await categories.getByRole('link',{name:label,exact:true}).click();
    await page.waitForURL('**'+href);
    await page.getByRole('heading',{name:label,level:1,exact:true}).waitFor();
    const state = await page.locator('.catalogue-content').evaluate(el=>({scrollTop:el.scrollTop,headingTop:el.querySelector('h1').getBoundingClientRect().top}));
    if(state.scrollTop!==0) throw new Error('Category starts scrolled: '+label+' '+JSON.stringify(state));
    await page.getByRole('button',{name:'Open navigation',exact:true}).waitFor();
  }
  await page.locator('.catalogue-content img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
  await page.getByRole('button',{name:'Open navigation',exact:true}).click();
  await page.getByRole('dialog',{name:'Nasty Burger House navigation'}).waitFor();
  await page.getByRole('button',{name:'Close navigation',exact:true}).click();
  await page.getByRole('button',{name:'More',exact:true}).click();
  await page.getByRole('button',{name:'Close more menu',exact:true}).click();
  await categories.getByRole('link',{name:'Burgers',exact:true}).click();
  await page.waitForURL('**/menu/burgers');
  await page.getByRole('link',{name:'View The OG Nasty',exact:true}).click();
  await page.waitForURL('**/product/og-nasty');
  await page.goBack();
  await page.waitForURL('**/menu/burgers');
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'output/playwright/menu-390.png'});
  await page.setViewportSize({width:768,height:1024});
  await page.screenshot({path:'output/playwright/menu-768.png'});
  return {categories:links.map(l=>l.label),scrolling:scrolled,productNavigation:true,drawers:true};
}
