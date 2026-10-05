import asyncio, json, sys
from playwright.async_api import async_playwright
URL='file:///home/claude/work/saju/site/index.html'
CASES=[('1990','5','15','14','30','여성','c1'),('1985','11','3',None,None,'남성','c2'),('2001','2','4','8','0','안 고를래요','c3')]
async def run(pg, y,m,d,h,mi,sx,tag, shots):
    await pg.goto(URL); await pg.wait_for_timeout(400)
    await pg.click('#start'); await pg.click('.lv[data-lv="mid"]'); await pg.click('[data-step="1"] button.ghost')
    for s,v in [('#me-y',y),('#me-m',m),('#me-d',d)]: await pg.select_option(s,v)
    await pg.click(f'.seg.sex button:has-text("{sx}")'); await pg.click('#next2')
    if h is None: await pg.check('#me-hunk')
    else: await pg.select_option('#me-h',h); await pg.select_option('#me-mi',mi)
    await pg.click('#go'); await pg.wait_for_timeout(1400)
    o={'chart':(await pg.inner_text('#chart')).replace('\n',' '),'note':await pg.inner_text('#chart-note'),'str':await pg.inner_text('#str-badge'),
       'yong':(await pg.inner_text('#yong-box')).replace('\n',' '),'yongwhy':await pg.inner_text('#yong-why'),'sinsal':(await pg.inner_text('#sinsal'))[:300]}
    for n in range(1,10):
        await pg.evaluate(f'window.__saju.showChap({n})'); await pg.wait_for_timeout(500)
        if n==6: await pg.click('#seal-2027 .cover'); await pg.wait_for_timeout(500)
        if n==7:
            for k in ['money','work','love','study','health']: await pg.click(f'[data-k="{k}"] .cover')
            await pg.wait_for_timeout(500)
        if shots: await pg.screenshot(path=f'r_{tag}_{n}.png', full_page=True)
    o['daeun']=(await pg.inner_text('#daeun'))[:400]; o['ymore']=await pg.inner_text('#y-more'); o['ystar']=await pg.inner_text('#y-score')
    o['areas']={k: await pg.inner_text(f'#a-{k}-t') for k in ['money','work','love','study','health']}
    o['stars']={k: await pg.inner_text(f'#s-{k}') for k in ['money','work','love','study']}
    o['months']=(await pg.inner_text('#months'))[:500]; o['saymonth']=await pg.inner_text('#say-month')
    return o
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=1); errs=[]
        pg.on('pageerror',lambda e: errs.append(str(e)))
        out={}
        for i,c in enumerate(CASES): out[c[-1]]=await run(pg,*c, shots=(i==0))
        out['scrollW']=await pg.evaluate('document.documentElement.scrollWidth'); out['errs']=errs
        print(json.dumps(out,ensure_ascii=False,indent=1)); await b.close()
asyncio.run(main())
