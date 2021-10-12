const puppeteer = require('puppeteer');
const Search = require('./search');
const express = require('express');

const app = express();
const port = 3333;

let page;
let search;

app.use(async (req, res, next) => {
    if(search && search.processing){
        await search.waitCurrentProcess();
    }

    next();
})

app.get('/:l/:page', async (req, res) => {
    const params = req.params;
    const queries = req.query;

    const query_params = {...params, ...queries}

    if(search === undefined){
        search = new Search(page, query_params);
        domain = await search.init();
    }

    if(search.params.l !== params.l){
        search = new Search(page, query_params);
        domain = await search.init();
    }

    search.buildParams(query_params)
    const jobs = await search.getJobs(Number(params.page));
    return res.json(jobs)
})

app.listen(port, async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--no-first-run',
            '--no-sandbox',
            '--no-zygote',
            `--user-data-dir=${process.cwd()}/browser_profile`,
        ]
    });

    const pages = await browser.pages();
    page = pages[0];

    page.setRequestInterception(true);

    const aborted_resource_types = ['image', 'stylesheet', 'font', 'script', 'javascript'];
    page.on('request', (req) => {
        if (aborted_resource_types.includes(req.resourceType()))
            req.abort();
        else
            req.continue();
    })
})
