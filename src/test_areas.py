import asyncio, json
from playwright.async_api import async_playwright
URL='file:///home/claude/work/saju/site/index.html'
async def run(pg, sexlabel, shot=None):
    await pg.goto(URL); await pg.wait_for_timeout(600)
    await pg.click('#start'); await pg.click('.lv[data-lv="mid"]'); await pg.click('[data-step="1"] button.ghost')
    for s,v in [('#me-y','1990'),('#me-m','5'),('#me-d','15')]: await pg.select_option(s,v)
    await pg.click(f'.seg.sex button:has-text("{sexlabel}")')
    if shot: await pg.screenshot(path=shot)
    await pg.click('#next2'); await pg.check('#me-hunk'); await pg.click('#go'); await pg.wait_for_timeout(1500)
    return {k: await pg.inner_text(s) for k,s in [('m','#a-money-t'),('w','#a-work-t'),('lt','#a-love-t'),('l','#a-love'),('sp','#a-spouse'),('say','#say-type')]}
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        pg=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=2); errs=[]
        pg.on('pageerror',lambda e: errs.append(str(e)))
        out={}
        out['여']=await run(pg,'여성','a_step2.png')
        out['남']=await run(pg,'남성')
        out['없음']=await run(pg,'안 고를래요')
        await pg.click('#voice'); await pg.wait_for_timeout(200)
        out['voicebtn']=await pg.inner_text('#voice') if await pg.is_visible('#voice') else 'hidden'
        btns=await pg.query_selector_all('.say-btn'); out['say_btns']=len(btns)
        for bt in btns: await bt.click(); await pg.wait_for_timeout(100)
        await pg.click('#read-areas')
        el=await pg.query_selector('#areas'); await el.scroll_into_view_if_needed(); await el.screenshot(path='a_card.png')
        out['speak']=await pg.evaluate("window.__saju.speakable('어서 와요~ 여기는 <b>이불 속 사주방</b> 🌙<br>누운 채로')")
        out['scrollW']=await pg.evaluate('document.documentElement.scrollWidth')
        out['errs']=errs
        print(json.dumps(out,ensure_ascii=False,indent=1))
        await b.close()
asyncio.run(main())
