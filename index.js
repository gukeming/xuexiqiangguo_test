const puppeteer = require('puppeteer');
const fs = require('fs');

const HOME_PAGE = 'https://www.xuexi.cn/'
const LOGIN_LINK = 'https://pc.xuexi.cn/points/login.html'

const TOKEN_DIR = "./token";

let browser = null;
let params = {};

function parseArgs() {
    const argv = process.argv
    if (argv.length <= 2) {
        console.log('请输入手机号')
        return
    }
    const phone = process.argv[2];
    if(phone.length !== 11) {
        console.log('手机号码格式不对');
        return
    }
    params.phone = phone;
}

async function createPage() {
    const page = await browser.newPage();

    // 设置浏览器视窗
    await page.setViewport({
        width: 1180,
        height: 1280,
    });
    return page
}

async function login(page, needlogin) {
    await page.goto(LOGIN_LINK);

    //读取本地保存的token 直接设置
    let data = "";
    try {
        data = await read(TOKEN_DIR + '/' + params.phone + '.txt');
        console.log('cookies data:', data)
    } catch (error) {
        console.log(error);
        data = "";
    }

    if(data && data !== '""' && !needlogin) {
        const cookie = JSON.parse(data);
        console.log('cookies data:', cookie)
        //判断cookie是否有效
        await page.setCookie(cookie);
    }  else {
        //等待20秒，扫码登录哦
        await page.waitFor(15000);
        await saveCookies(page);
    }
}

function write(filename, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filename, data, (err) => {
            if (err) {
                reject(err);
            }
            resolve(0)
        });
    })
}

function read(filename) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            const dataStr = data.length > 0 ? data.toString() : "";
            resolve(dataStr);
        });
    })
}

async function saveCookies(page) {
    let tokenObj = "";
    const cookiesSet =  await page.cookies(HOME_PAGE);
    for(var i = 0; i < cookiesSet.length; ++i) {
        if(cookiesSet[i].name === 'token') {
            console.log(cookiesSet[i])
            tokenObj = cookiesSet[i];
            break;
        }
    }

    await write(TOKEN_DIR + '/' + params.phone + '.txt', JSON.stringify(tokenObj));
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

async function goHome(page) {
    await page.goto(HOME_PAGE)
    await page.waitFor(5000)

    //判断有没有登录
    let logged = await page.$('.logged-text');
    if(!logged) {
        console.log('请等待扫描二维码登录');
        await login(page, true);
        await goHome(page);
    }
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
    try {

        parseArgs();

        browser = await puppeteer.launch({
            headless:false,
            slowMo: 250,
            defaultViewport: { // 浏览器框的大小
                width: 1180,
                height: 1280,
            },
            args: ['--autoplay-policy', '--ash-host-window-bounds="1024x768*2"', '--enable-automation']
        });
        const page = await createPage()
    
        await login(page)
    
        await goHome(page)
    
        await xuexi(page)
    
        await page.waitFor(3000);
    
        browser.close()
    } catch (error) {
        console.log(error);
        browser.close();
    }
}

(function(){
    try {
        main()
    } catch(e) {
        console.log(e)
        browser && browser.close();
    }
})()