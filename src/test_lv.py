import asyncio, json
from playwright.async_api import async_playwright
URL='file:///home/claude/work/saju/site/index.html'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        pg=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=2); errs=[]
        pg.on('pageerror',lambda e: errs.append(str(e)))
        out={}
        # 처음이에요 흐름
        await pg.goto(URL); await pg.click('#door'); await pg.wait_for_timeout(1400)
        await pg.click('#start'); await pg.wait_for_timeout(300); await pg.screenshot(path='lv_10.png'); out['b10']=await pg.get_attribute('#bubble-text','data-full')
        await pg.click('.lv[data-lv="new"]')
        for n in (11,12,13,14,15,16):
            await pg.wait_for_timeout(550); await pg.screenshot(path=f'lv_{n}.png'); out[f'b{n}']=await pg.get_attribute('#bubble-text','data-full')
            await pg.click(f'[data-step="{n}"] .gnext')
        await pg.wait_for_timeout(300); out['after_guide']=await pg.get_attribute('#bubble-text','data-full')
        await pg.click('[data-step="1"] button.ghost')
        for s,v in [('#me-y','1990'),('#me-m','5'),('#me-d','15')]: await pg.select_option(s,v)
        await pg.click('.seg.sex button:has-text("여성")')
        await pg.click('.seg.sex button:has-text("여성")'); await pg.click('#next2'); await pg.select_option('#me-h','14'); await pg.click('#go'); await pg.wait_for_timeout(9500)
        out['tips_visible_new']=[await pg.is_visible('.tip.lv-new >> nth=0')]
        await pg.evaluate('window.__saju.showChap(2)'); out['tips_visible_new'].append(await pg.is_visible('#tip-type'))
        out['tip_type']=await pg.inner_text('#tip-type')
        out['count0']=await pg.inner_text('#open-count')
        await pg.evaluate('window.__saju.showChap(7)')
        out['money_hidden']=not await pg.is_visible('#a-money-t')
        await pg.click('[data-k="money"] .cover'); await pg.wait_for_timeout(600)
        out['count1']=await pg.inner_text('#open-count'); out['say1']=await pg.inner_text('#say-areas')
        await pg.click('[data-k="work"] .cover'); await pg.click('[data-k="love"] .cover'); await pg.wait_for_timeout(600)
        out['count3']=await pg.inner_text('#open-count'); out['say3']=await pg.inner_text('#say-areas')
        await pg.evaluate('window.__saju.showChap(6)')
        await pg.click('#seal-2027 .cover'); await pg.wait_for_timeout(600)
        out['tip_year']=await pg.inner_text('#tip-year')
        await pg.evaluate('window.__saju.showChap(7)'); el=await pg.query_selector('#areas'); await el.screenshot(path='lv_areas_open.png')
        await pg.screenshot(path='lv_result_new.png', full_page=True)
        # 잘 알아요 흐름: 십신 표시
        await pg.goto(URL+'?x'); await pg.click('#door'); await pg.wait_for_timeout(1400)
        await pg.click('#start'); await pg.click('.lv[data-lv="pro"]'); await pg.click('[data-step="1"] button.ghost')
        for s,v in [('#me-y','1990'),('#me-m','5'),('#me-d','15')]: await pg.select_option(s,v)
        await pg.click('.seg.sex button:has-text("여성")'); await pg.click('#next2'); await pg.select_option('#me-h','14'); await pg.click('#go'); await pg.wait_for_timeout(9500)
        out['chart_pro']=(await pg.inner_text('#chart')).replace('\n',' ')
        await pg.evaluate('window.__saju.showChap(6)'); await pg.click('#seal-2027 .cover'); await pg.wait_for_timeout(400)
        out['tip_year_pro']=await pg.inner_text('#tip-year-pro')
        await pg.evaluate('window.__saju.showChap(2)'); out['tips_new_hidden_in_pro']=not await pg.is_visible('#tip-type')
        await pg.evaluate('window.__saju.showChap(1)'); el=await pg.query_selector('#chart'); await el.screenshot(path='lv_chart_pro.png')
        out['scrollW']=await pg.evaluate('document.documentElement.scrollWidth'); out['errs']=errs
        print(json.dumps(out,ensure_ascii=False,indent=1)); await b.close()
asyncio.run(main())
