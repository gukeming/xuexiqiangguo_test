const puppeteer = require('puppeteer');

const HOME_PAGE = 'https://www.xuexi.cn/'
const LOGIN_LINK = 'https://pc.xuexi.cn/points/login.html'

//更多头条文章列表
let browser = null;

async function createPage() {
    const page = await browser.newPage();
    // 设置浏览器视窗
    // page.setViewport({
    //     width: 1200,
    //     height: 1500,
    // });
    return page
}

async function login(page) {
    await page.goto(LOGIN_LINK)

    await page.evaluate(() =>{
        window.scrollTo(0,1000)
    });
     
    //等待20秒，扫码登录哦
    await page.waitFor(15000);
}

async function saveCookies(page) {
    const cookiesSet =  await page.cookies(HOME_PAGE);
    //console.log(cookiesSet)
}

//可以用来拦截网络请求返回的数据
async function getResponseMsg(page, url) {
    return new Promise((resolve, reject) => {
        page.on('request', request => {
            if (request.url().indexOf(url) != -1) {
                page.on('response', async response => {
                    if (response.request().url().indexOf(url) != -1) {
                        // const req = response.request();
                        // //console.log("Response 的:" + req.method(), response.status(), req.url());
                        let data = await response.json(); 
                        // console.log(data)
                        resolve(data)
                    }
                });
                request.continue();
            } else {
                request.continue();
            }
 
        });
    }).catch(new Function()).then();
 
}

//阅读学习
// async function readXuexi(page) {
//     await page.goto(TOUTIAO_LIST);
//     await page.waitFor(3000);

//     let list = await page.$$('.text-link-item-title'); 
//     for(let i = 10; i < 20; i++) {
//         list[i].click();
//         await page.waitFor(100000);
//         const pages = await browser.pages();
//         //关闭打开的tab页
//         pages[pages.length - 1].close();
//     }
// }

async function currPage() {
    const pages = await browser.pages();
    //返回最后一个打开的页面
    return pages[pages.length - 1];
}

//阅读学习
async function readXuexi(page) {
    const toutiaoPage = await currPage();
    await toutiaoPage.waitFor(8000)

    let list = await toutiaoPage.$$('.text-link-item-title'); 
    for(let i = 0; i < 10; i++) {
        console.log(i)
        list[i].click();
        await toutiaoPage.waitFor(200000);
        const nowpage = await currPage()
        //关闭打开的tab页
        nowpage.close();
    }

    toutiaoPage.close();
}


async function xuexi(page) {
    await page.goto(HOME_PAGE)
    await page.waitFor(5000)

    //头条学习
    await page.click('.moreUrl'); 
    await readXuexi(page)

    //重要新闻
    await page.click('.linkSpan'); 
    await readXuexi(page)

    // //第一频道
    const newPage = await createPage();
    await newPage.goto('https://www.xuexi.cn/4426aa87b0b64ac671c96379a3a8bd26/db086044562a57b441c24f2af1c8e101.html#11c4o0tv7nb-5', {
        //waitUntil: 'networkidle0'
    })
    await newPage.waitFor(12000)
    await newPage.click('.list')
    await readXuexi(page)
}


async function main() {
    browser = await puppeteer.launch({
        headless:false,
        slowMo: 250,
        defaultViewport: { // 浏览器框的大小
            width: 1366,
            height: 768
        },
        args: ['--autoplay-policy', '--ash-host-window-bounds="1024x768*2"', '--enable-automation']
    });
    const page = await createPage()

    await login(page)

    await page.waitFor(3000);
    await saveCookies(page);

    await xuexi(page)

    await page.waitFor(3000);

    browser.close();
}

(function(){
    try {
        main()
    } catch(e) {
        console.log(e)
        browser && browser.close();
    }
})()