import asyncio, json
from playwright.async_api import async_playwright
URL='file:///home/claude/work/saju/site/index.html'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        ctx=await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, accept_downloads=True, permissions=['clipboard-read','clipboard-write'])
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        out={}
        await pg.goto(URL); await pg.wait_for_timeout(1200)
        for sel,v in [('#me-y','1990'),('#me-m','5'),('#me-d','15'),('#me-h','14'),('#me-mi','30')]: await pg.select_option(sel,v)
        await pg.click('#form button[type=submit]'); await pg.wait_for_timeout(500)
        out['invite_hidden_normal']=await pg.is_hidden('#invite')
        await pg.fill('#nick','쉬고싶은청년'); await pg.click('#make-link'); await pg.wait_for_timeout(500)
        out['link_msg']=await pg.inner_text('#link-msg')
        clip=await pg.evaluate('navigator.clipboard.readText()'); out['clip']=clip
        for bid,name in [('#share','c_me.png'),('#share-2027','c_2027.png')]:
            async with pg.expect_download() as dl: await pg.click(bid)
            await (await dl.value).save_as(name)
        # 친구가 링크로 들어옴
        link=clip.split(' ')[-1].replace('file://','file://')
        pg2=await ctx.new_page(); pg2.on('pageerror', lambda e: errs.append(str(e)))
        await pg2.goto(link); await pg2.wait_for_timeout(1200)
        out['invite_shown']=not await pg2.is_hidden('#invite'); out['invite_text']=await pg2.inner_text('#invite')
        out['btn']=await pg2.inner_text('#form button[type=submit]')
        for sel,v in [('#me-y','1992'),('#me-m','3'),('#me-d','3')]: await pg2.select_option(sel,v)
        await pg2.check('#me-hunk'); await pg2.click('#form button[type=submit]'); await pg2.wait_for_timeout(600)
        out['gh']=await pg2.inner_text('#gh-result')
        await pg2.screenshot(path='shot_invite.png', full_page=False)
        async with pg2.expect_download() as dl: await pg2.click('#share-gh')
        await (await dl.value).save_as('c_gh.png')
        # 잘못된 링크
        pg3=await ctx.new_page(); await pg3.goto(URL+'#g=x&n=<script>'); await pg3.wait_for_timeout(500)
        out['bad_hidden']=await pg3.is_hidden('#invite')
        out['scrollW']=await pg2.evaluate('document.documentElement.scrollWidth'); out['errs']=errs
        print(json.dumps(out,ensure_ascii=False,indent=1)); await b.close()
asyncio.run(main())
