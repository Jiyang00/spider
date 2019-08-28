import puppeteer from 'puppeteer'  // 引入Puppeteer
import chalk from 'chalk' // 一个美化 console 输出的库
const log = console.log // 缩写 console.log
const TOTAL_PAGE = 50;
// 定义要爬去的数据结构
interface IWriteData {
    link: string // 爬取到的商品详情链接
    picture: string // 爬取到的图片链接
    price: number // 价格，number类型，需要从爬取下来的数据进行转型
    title: string // 爬取到的商品标题
}
function formatProgress(current: number): string {
    let percent = (current / TOTAL_PAGE) * 100
    let done = ~~(current / TOTAL_PAGE * 40)
    let left = 40 - done
    let str = `当前进度：[${''.padStart(done, '=')}${''.padStart(left, '-')}]   ${percent}%`
    return str
}
main();
async function main() {
    console.log(puppeteer);
    const browser = await puppeteer.launch();
    log(chalk.green('服务正常启动'));
    try {
        const page = await browser.newPage();
        const handleData = async () => {
            // 现在我们进入浏览器内部搞些事情，通过page.evaluate方法，该方法的参数是一个函数，这个函数将会在页面内部运行，这个函数的返回的数据将会以Promise的形式返回到外部 
            const list = await page.evaluate(() => {

                // 先声明一个用于存储爬取数据的数组
                const writeDataList: IWriteData[] = []

                // 获取到所有的商品元素
                let itemList = document.querySelectorAll('.item.J_MouserOnverReq')
                // 遍历每一个元素，整理需要爬取的数据
                for (let item of <any>itemList) {
                    // 首先声明一个爬取的数据结构
                    let writeData: IWriteData = {
                        picture: undefined,
                        link: undefined,
                        title: undefined,
                        price: undefined
                    }

                    // 找到商品图片的地址
                    let img = item.querySelector('img')
                    writeData.picture = img.src

                    // 找到商品的链接
                    let link: HTMLAnchorElement = item.querySelector('.pic-link.J_ClickStat.J_ItemPicA')
                    writeData.link = link.href

                    // 找到商品的价格，默认是string类型 通过~~转换为整数number类型
                    let price = item.querySelector('strong')
                    writeData.price = ~~price.innerText

                    // 找到商品的标题，淘宝的商品标题有高亮效果，里面有很多的span标签，不过一样可以通过innerText获取文本信息
                    let title: HTMLAnchorElement = item.querySelector('.title>a')

                    writeData.title = title.innerText

                    // 将这个标签页的数据push进刚才声明的结果数组
                    writeDataList.push(writeData)
                }
                // 当前页面所有的返回给外部环境
                return writeDataList

            })
            // const result = await mongo.insertMany('GTX1080', list)

            log(chalk.yellow('写入数据库完毕'))
        }
        page.on('console', msg => {
            if (typeof msg === 'object') {
                console.dir(msg)
            } else {
                log(chalk.blue(msg))
            }
        });
        // 打开我们刚刚看见的淘宝页面
        await page.goto('https://s.taobao.com/search?q=gtx1080&imgfile=&js=1&stats_click=search_radio_all%3A1&initiative_id=staobaoz_20180416&ie=utf8');
        log(chalk.yellow('页面初次加载完毕'))
        for (let i = 1; i <= TOTAL_PAGE; i++) {
            // 找到分页的输入框以及跳转按钮
            const pageInput = await page.$(`.J_Input[type='number']`)
            const submit = await page.$('.J_Submit')
            // 模拟输入要跳转的页数
            await pageInput.type('' + i)
            // 模拟点击跳转
            await submit.click()
            // 等待页面加载完毕，这里设置的是固定的时间间隔，之前使用过page.waitForNavigation()，但是因为等待的时间过久导致报错（Puppeteer默认的请求超时是30s,可以修改）,因为这个页面总有一些不需要的资源要加载，而我的网络最近日了狗，会导致超时，因此我设定等待2.5s就够了
            await page.waitFor(2500)

            // 清除当前的控制台信息
            console.clear()
            // 打印当前的爬取进度
            log(chalk.yellow(formatProgress(i)))
            log(chalk.yellow('页面数据加载完毕'))

            // 处理数据，这个函数的实现在下面
            await handleData()
            // 一个页面爬取完毕以后稍微歇歇，不然太快淘宝会把你当成机器人弹出验证码（虽然我们本来就是机器人）
            await page.waitFor(2500)
        }
        await browser.close()
        log(chalk.green('服务正常结束'))
        // 这是一个在内部声明的函数，之所以在内部声明而不是外部，是因为在内部可以获取相关的上下文信息，如果在外部声明我还要传入 page 这个对象
        
    } catch (error) {

    }
}