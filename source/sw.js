/** 缓存库（数据）名称 */
const CACHE_NAME = 'icemystCache'
/** 缓存库（时间戳）名称 */
const VERSION_CACHE_NAME = 'icemystCacheTime'
/** 缓存离线超时时间 */
const MAX_ACCESS_CACHE_TIME = 60 * 60 * 24 * 10

function time() {
    return new Date().getTime()
}

const dbHelper = {
    read: (key) => {
        return new Promise((resolve) => {
            caches.match(key).then(function (res) {
                if (!res) resolve(null)
                res.text().then(text => resolve(text))
            }).catch(() => {
                resolve(null)
            })
        })
    },
    write: (key, value) => {
        return new Promise((resolve, reject) => {
            caches.open(VERSION_CACHE_NAME).then(function (cache) {
                // noinspection JSIgnoredPromiseFromCall
                cache.put(key, new Response(value));
                resolve()
            }).catch(() => {
                reject()
            })
        })
    },
    delete: (key) => {
        caches.match(key).then(response => {
            if (response) caches.open(VERSION_CACHE_NAME).then(cache => cache.delete(key))
        })
    }
}

/** 存储缓存入库时间 */
const dbTime = {
    read: (key) => dbHelper.read(new Request(`https://LOCALCACHE/${encodeURIComponent(key)}`)),
    write: (key, value) => dbHelper.write(new Request(`https://LOCALCACHE/${encodeURIComponent(key)}`), value),
    delete: (key) => dbHelper.delete(new Request(`https://LOCALCACHE/${encodeURIComponent(key)}`))
}

/** 存储缓存最后一次访问的时间 */
const dbAccess = {
    update: (key) => dbHelper.write(new Request(`https://ACCESS-CACHE/${encodeURIComponent(key)}`), time()),
    check: async (key) => {
        const realKey = new Request(`https://ACCESS-CACHE/${encodeURIComponent(key)}`)
        const value = await dbHelper.read(realKey)
        if (value) {
            dbHelper.delete(realKey)
            return time() - value < MAX_ACCESS_CACHE_TIME
        } else return false
    }
}

self.addEventListener('install', () => self.skipWaiting())

/**
 * 缓存列表
 * @param url 匹配规则
 * @param time 缓存有效时间
 * @param clean 清理缓存时是否无视最终访问时间直接删除
 */
const cacheList = {
    sample: {
        url: /[填写正则表达式]/g,
        time: Number.MAX_VALUE,
        clean: true
    }
}

/**
 * 链接替换列表
 * @param source 源链接
 * @param dist 目标链接
 */
const replaceList = {
    sample: {
        source: ['//www.hcer.top'],
        dist: '//hcer.top'
    }
}

/** 判断指定url击中了哪一种缓存，都没有击中则返回null */
function findCache(url) {
    for (let key in cacheList) {
        const value = cacheList[key]
        if (url.match(value.url)) return value
    }
    return null
}

/**
 * 检查连接是否需要重定向至另外的链接，如果需要则返回新的Request，否则返回null<br/>
 * 该函数会顺序匹配{@link replaceList}中的所有项目，即使已经有可用的替换项<br/>
 * 故该函数允许重复替换，例如：<br/>
 * 如果第一个匹配项把链接由"http://abc.com/"改为了"https://abc.com/"<br/>
 * 此时第二个匹配项可以以此为基础继续进行修改，替换为"https://abc.net/"<br/>
 */
function replaceRequest(request) {
    let url = request.url;
    let flag = false
    for (let key in replaceList) {
        const value = replaceList[key]
        for (let source of value.source) {
            if (url.match(source)) {
                url = url.replace(source, value.dist)
                flag = true
            }
        }
    }
    return flag ? new Request(url) : null
}

/** 判断是否拦截指定的request */
function blockRequest(request) {
    return false
}

async function fetchEvent(request, response, cacheDist) {
    const NOW_TIME = time()
    // noinspection ES6MissingAwait
    dbAccess.update(request.url)
    const maxTime = cacheDist.time
    let remove = false
    if (response) {
        const time = await dbTime.read(request.url)
        if (time) {
            const difTime = NOW_TIME - time
            if (difTime < maxTime) return response
        }
        remove = true
    }
    const fetchFunction = () => fetch(request).then(response => {
        dbTime.write(request.url, NOW_TIME)
        //如果加载正常再缓存
        //至于为什么多了个检测与0相等是因为我实操的时候遇到了status为0的情况
        //为什么会有0我没搞清楚，知道的小伙伴可以分享一下
        if (response.ok || response.status === 0) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return response
    })
    if (!remove) return fetchFunction()
    const timeOut = () => new Promise((resolve => setTimeout(() => resolve(response), 400)))
    return Promise.race([
        timeOut(),
        fetchFunction()]
    ).catch(err => console.error('不可达的链接：' + request.url + '\n错误信息：' + err))
}

self.addEventListener('fetch', async event => {
    const replace = replaceRequest(event.request)
    const request = replace === null ? event.request : replace
    const cacheDist = findCache(request.url)
    if (blockRequest(request)) {
        event.respondWith(new Response(null, {status: 204}))
    } else if (cacheDist !== null) {
        event.respondWith(caches.match(request)
            .then(async (response) => fetchEvent(request, response, cacheList))
        )
    } else if (replace !== null) {
        event.respondWith(fetch(request))
    }
})