import asyncio
from playwright.async_api import async_playwright
URL='file:///home/claude/work/saju/site/gift/index.html'
async def pick(pg, v): await pg.click(f'#st-body .opt[data-v="{v}"]'); await pg.wait_for_timeout(350)
async def date(pg, y, m, d):
  await pg.fill('#f-yt', str(y)); await pg.select_option('#f-m', str(m)); await pg.select_option('#f-d', str(d))
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':390,'height':844}, device_scale_factor=2)
    errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(URL); await pg.click('#h-give')
    await pg.screenshot(path='/tmp/claude-0/q1.png', full_page=True)
    await pick(pg,'l'); await pick(pg,'pepero'); await pick(pg,'3')
    await pg.screenshot(path='/tmp/claude-0/q4.png', full_page=True)
    await pick(pg,'i'); await pick(pg,'m')
    await date(pg,1995,3,15); await pg.click('#st-next'); await pg.wait_for_timeout(300)
    await pg.screenshot(path='/tmp/claude-0/q7.png', full_page=True)
    await date(pg,1994,11,2); await pg.click('#st-next')
    await pg.wait_for_selector('#s-result:not([hidden])', timeout=5000)
    await pg.click('#r-box'); await pg.wait_for_timeout(1500)
    await pg.screenshot(path='/tmp/claude-0/r1.png', full_page=True)
    print('주기 선물:', await pg.eval_on_selector_all('.g-main b','e=>e.map(x=>x.textContent)'))
    print('카드:', await pg.inner_text('#r-cardmsg'))
    print('궁합:', (await pg.inner_text('#r-compat'))[:120].replace('\n',' / '))
    # 뒤로 가기 검사
    await pg.goto(URL); await pg.click('#h-beg'); await pg.fill('#f-nick','쉬고싶은청년'); await pg.click('#st-next'); await pg.wait_for_timeout(200)
    await pick(pg,'p'); await pg.click('#st-back'); await pg.wait_for_timeout(200); print('이전 단계 질문:', await pg.inner_text('#st-q'))
    await pick(pg,'l'); await pick(pg,'bday'); await pick(pg,'5'); await pick(pg,'3'); await pick(pg,'o'); await pick(pg,'u')
    await date(pg,1997,7,2); await pg.click('#st-next')
    await pg.wait_for_selector('#s-result:not([hidden])', timeout=5000); await pg.click('#r-box'); await pg.wait_for_timeout(1200)
    link=await pg.inner_text('.linkbox'); print('조르기 링크:', link)
    g1=await pg.eval_on_selector_all('.g-main b','e=>e.map(x=>x.textContent)')
    await pg.screenshot(path='/tmp/claude-0/r2.png', full_page=True)
    await pg.goto(link); await pg.wait_for_timeout(400); print('받는 쪽:', await pg.inner_text('#bubble-text'))
    await pg.click('#r-box'); await pg.wait_for_timeout(1200)
    g2=await pg.eval_on_selector_all('.g-main b','e=>e.map(x=>x.textContent)'); print('양쪽 같음:', g1==g2, g2)
    await pg.click('#c-open'); await date(pg,1996,5,20); await pg.click('#c-go'); await pg.wait_for_timeout(500)
    print('받는 쪽 궁합:', (await pg.inner_text('#r-compat'))[:80].replace('\n',' / '))
    print('받는 쪽 카드:', await pg.inner_text('#r-cardmsg'))
    await pg.click('.promise >> nth=1'); await pg.fill('#p-nick','산타')
    await pg.evaluate("()=>{window.__copied=null; navigator.clipboard.writeText=async(t)=>{window.__copied=t}}")
    await pg.click('#p-make'); await pg.wait_for_timeout(300)
    ok=await pg.evaluate('()=>window.__copied'); print('약속 링크:', ok)
    await pg.screenshot(path='/tmp/claude-0/r3.png', full_page=True)
    await pg.goto(ok); await pg.wait_for_timeout(1200); print('약속 화면:', await pg.inner_text('#bubble-text'))
    await pg.screenshot(path='/tmp/claude-0/r4.png', full_page=True)
    # 옛 5자리 링크도 열리는지
    await pg.goto(URL+'?j=142c3&n=x'); await pg.wait_for_timeout(300); print('옛 링크 열림:', await pg.is_visible('#s-result'))
    await pg.goto(URL+'?ok=zz&n=x'); await pg.wait_for_timeout(300); print('엉터리 약속 → 첫 화면:', await pg.is_visible('#s-home'))
    # 전체 조합: 모든 기운×관계×예산×취향에서 선물 3개 나오는지
    r=await pg.evaluate("""()=>{const G=window.__gift;let bad=[];const B={l:[1,3,5,10],p:[1,3,5,10],c:[1,3,5]};
      for(const el of ['목','화','토','금','수'])for(const rel of 'lpc')for(const b of B[rel])for(const io of 'io')for(const um of 'um'){const g=G.pickGifts(el,rel,b,io,um,'x'+el+rel+b+io+um);if(g.length<3)bad.push(el+rel+b)}
      const sc={};let s=7;const rnd=()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648};
      for(let i=0;i<2000;i++){const a=G.calc(1960+Math.floor(rnd()*46),1+Math.floor(rnd()*12),1+Math.floor(rnd()*28));const c=G.calc(1960+Math.floor(rnd()*46),1+Math.floor(rnd()*12),1+Math.floor(rnd()*28));const x=G.compat(a.stem,c).score;sc[x]=(sc[x]||0)+1}
      const ks=Object.keys(sc).map(Number).sort((a,b)=>a-b);return {모자람:bad.length,궁합최저:ks[0],궁합최고:ks[ks.length-1],점수종류:ks.length}}""")
    print('조합 검사:', r)
    print('오류:', errs)
    await b.close()
asyncio.run(main())
