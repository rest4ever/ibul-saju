from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto('file:///home/claude/work/saju/site/index.html'); pg.wait_for_timeout(500)
    pg.click('.tabs .tab[data-tab="tarot"]'); pg.wait_for_timeout(1200)
    out={'say':pg.inner_text('#t-say'),'deck':pg.locator('.t-back').count(),'stage_hidden':pg.is_hidden('#stage')}
    pg.screenshot(path='t_deck.png')
    pg.locator('.t-back').nth(5).click(); pg.wait_for_timeout(900)
    pg.locator('.t-card').first.click(); pg.wait_for_timeout(1200)
    out['one']=pg.inner_text('#t-result'); pg.screenshot(path='t_one.png',full_page=True)
    pg.click('.t-topic[data-t="love"]'); pg.wait_for_timeout(1000)
    for i in (1,7,13): pg.locator('.t-back').nth(i).click(); pg.wait_for_timeout(150)
    pg.wait_for_timeout(800)
    for c in pg.locator('.t-card').all(): c.click(); pg.wait_for_timeout(300)
    pg.wait_for_timeout(1000)
    out['love']=pg.inner_text('#t-result')[:400]; out['say2']=pg.inner_text('#t-say')
    pg.screenshot(path='t_love.png',full_page=True)
    pg.click('.tabs .tab[data-tab="saju"]'); pg.wait_for_timeout(300); out['back_stage']=pg.is_visible('#stage')
    out['scrollW']=pg.evaluate('document.documentElement.scrollWidth'); out['errs']=errs
    print(json.dumps(out,ensure_ascii=False,indent=1)); b.close()
