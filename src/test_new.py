import json
from playwright.sync_api import sync_playwright
URL='file:///home/claude/work/saju/site/index.html'
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    out={}
    pg.goto(URL); pg.click('#door'); pg.wait_for_timeout(1400); pg.screenshot(path='n_home.png')
    out['home']=pg.get_attribute('#bubble-text','data-full'); out['title']=pg.inner_text('#top-title')
    # 사주: 빈 입력 막기
    pg.click('#start'); pg.click('.lv[data-lv="mid"]'); pg.click('[data-step="1"] button.ghost')
    pg.click('#next2'); pg.wait_for_timeout(200); out['err_empty']=pg.inner_text('#err2')
    for s,v in [('#me-y','1990'),('#me-m','5'),('#me-d','15')]: pg.select_option(s,v)
    pg.click('#next2'); pg.wait_for_timeout(200); out['err_sex']=pg.inner_text('#err2')
    pg.click('.seg.sex button:has-text("여성")'); pg.click('#next2'); pg.wait_for_timeout(300)
    pg.click('#go'); pg.wait_for_timeout(200); out['err_time']=pg.inner_text('#err')
    pg.select_option('#me-h','14'); pg.click('#go'); pg.wait_for_timeout(9500)
    out['terms']=pg.locator('#result .term').count()
    pg.evaluate('window.__saju.showChap(3)'); pg.wait_for_timeout(300)
    t=pg.locator('.chap.on .term').first; out['term_word']=t.inner_text(); t.click(); pg.wait_for_timeout(300)
    out['gloss']=pg.inner_text('#gloss-x'); pg.screenshot(path='n_gloss.png'); pg.click('#gloss-close')
    # 상담소로 → 타로
    pg.evaluate('window.scrollTo(0,0)'); pg.wait_for_timeout(300); pg.locator('#home-btn').dispatch_event('click'); pg.wait_for_timeout(300); pg.click('#go-tarot'); pg.wait_for_timeout(300)
    out['t30']=pg.get_attribute('#bubble-text','data-full'); out['ttitle']=pg.inner_text('#top-title')
    pg.click('.tlv[data-tl="new"]'); pg.wait_for_timeout(2000); pg.screenshot(path='n_t31.png')
    pg.click('[data-step="31"] [data-tnext="32"]'); pg.wait_for_timeout(1500); pg.screenshot(path='n_t32.png')
    pg.click('[data-step="32"] [data-tnext="33"]'); pg.wait_for_timeout(300)
    pg.click('.t-topic[data-t="love"]'); pg.fill('#t-q','우리 관계 어떻게 하면 좋을까?'); pg.click('#t-q-next'); pg.wait_for_timeout(300)
    pg.click('[data-step="34"] [data-tnext="35"]'); pg.wait_for_timeout(300)
    pg.click('#t-shuf'); pg.wait_for_timeout(800); pg.screenshot(path='n_t35.png'); pg.click('#t-shuf'); pg.wait_for_timeout(400)
    pg.screenshot(path='n_t36.png'); pg.locator('.t-pile').nth(1).click(); pg.wait_for_timeout(1000)
    for i in (2,5,9): pg.locator('.t-back').nth(i).click(); pg.wait_for_timeout(120)
    out['pick3']=pg.inner_text('#t-count'); out['confirm_enabled']=pg.is_enabled('#t-confirm')
    pg.locator('.t-back').nth(5).click(); pg.wait_for_timeout(120)
    out['after_cancel']=pg.inner_text('#t-count'); out['confirm_enabled2']=pg.is_enabled('#t-confirm')
    pg.locator('.t-back').nth(12).click(); pg.wait_for_timeout(200); pg.screenshot(path='n_t37.png')
    pg.click('#t-confirm'); pg.wait_for_timeout(500)
    out['door_gone']=pg.evaluate("document.getElementById('door').classList.contains('gone')")
    steps=[]; more_done=False
    for it in range(120):
        if pg.is_visible('#t-end'): break
        chips=pg.locator('#t-reply .chip')
        if pg.is_visible('#t-reply') and chips.count():
            labels=[chips.nth(i).inner_text() for i in range(chips.count())]
            if not more_done and any('더 알려' in l for l in labels):
                chips.filter(has_text='더 알려').click(); more_done=True; steps.append('more')
            else:
                chips.first.click(); steps.append(labels[0])
            if it==2: pg.screenshot(path='n_t38a.png')
        pg.wait_for_timeout(700)
    out['steps']=steps
    out['map']=pg.inner_text('#t-map').replace('\n',' ')
    out['chat_n']=pg.locator('#t-chat .msg').count()
    out['chat_tail']=[pg.locator('#t-chat .msg').nth(i).inner_text()[:90] for i in range(max(0,out['chat_n']-6),out['chat_n'])]
    out['end_dbg']=pg.evaluate("[document.getElementById('t-end').hidden, getComputedStyle(document.getElementById('t-end')).display, document.querySelector('[data-step=\"38\"]').hidden]"); out['end_visible']=pg.is_visible('#t-end'); pg.screenshot(path='n_t38.png',full_page=True)
    out['btn_heights']=pg.evaluate("[...document.querySelectorAll('#t-end button,#t-reply button')].map(b=>Math.round(b.getBoundingClientRect().height))")
    out['scrollW']=pg.evaluate('document.documentElement.scrollWidth'); out['errs']=errs
    print(json.dumps(out,ensure_ascii=False,indent=1)); b.close()
