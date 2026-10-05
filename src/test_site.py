import asyncio, json
from playwright.async_api import async_playwright
URL='file:///home/claude/work/saju/site/index.html'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        pg=await b.new_page(viewport={'width':390,'height':844}, device_scale_factor=2, accept_downloads=True)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append('console:'+m.text) if m.type=='error' else None)
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        out={}
        # 1) README 예시 1990-05-15 14:30 (보정) → 경오 신사 경진 계미
        for sel,v in [('#me-y','1990'),('#me-m','5'),('#me-d','15'),('#me-h','14'),('#me-mi','30')]: await pg.select_option(sel,v)
        await pg.click('#form button[type=submit]'); await pg.wait_for_timeout(600)
        out['ex1_chart']=await pg.inner_text('#chart'); out['ex1_note']=await pg.inner_text('#chart-note')
        out['ex1_type']=await pg.inner_text('#type-name'); out['ex1_year']=await pg.inner_text('#y-title'); out['ex1_bars']=await pg.inner_text('#bars')
        await pg.screenshot(path='shot_full.png', full_page=True)
        # 2) 궁합: 상대 1992-03-03
        for sel,v in [('#you-y','1992'),('#you-m','3'),('#you-d','3')]: await pg.select_option(sel,v)
        await pg.click('#gh-form button[type=submit]'); await pg.wait_for_timeout(300)
        out['gh']=await pg.inner_text('#gh-result')
        # 3) 공유 (헤드리스는 공유 기능이 없어 저장으로 감)
        async with pg.expect_download() as dl: await pg.click('#share')
        d=await dl.value; await d.save_as('card_test.png'); out['card']='saved'
        # 4) 시간 모름
        await pg.check('#me-hunk'); await pg.click('#form button[type=submit]'); await pg.wait_for_timeout(300)
        out['unk_chart']=await pg.inner_text('#chart'); out['unk_total']=await pg.inner_text('#el-total')
        # 5) 없는 날짜
        await pg.select_option('#me-m','2'); await pg.select_option('#me-d','30'); await pg.click('#form button[type=submit]'); await pg.wait_for_timeout(200)
        out['bad_solar']=await pg.inner_text('#err')
        # 6) 음력 + 없는 윤달
        await pg.select_option('#me-cal','lunar'); await pg.select_option('#me-y','1990'); await pg.select_option('#me-m','1'); await pg.select_option('#me-d','1'); await pg.check('#me-leap')
        await pg.click('#form button[type=submit]'); await pg.wait_for_timeout(200); out['bad_leap']=await pg.inner_text('#err')
        await pg.uncheck('#me-leap'); await pg.click('#form button[type=submit]'); await pg.wait_for_timeout(200)
        out['lunar_ok_note']=await pg.inner_text('#chart-note'); out['lunar_err']=await pg.inner_text('#err')
        # 7) 가로 넘침
        out['scrollW']=await pg.evaluate('document.documentElement.scrollWidth')
        out['errs']=errs
        print(json.dumps(out,ensure_ascii=False,indent=1))
        await b.close()
asyncio.run(main())
