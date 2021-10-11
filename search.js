const throat = require('throat');

class Search{
    constructor(page, params){
        this.page = page;
        this.params = params;
        this.buildParams({...params, start: 0});
        this.domain = "indeed.com";

        this.processing = false;
    }
    buildParams = (params) => {
        this.params_str = Object.entries(params).map(([key, val]) => `${key}=${val}`).join("&");
    }
    init = async () => {
        this.processing = true;
        await this.page.goto(`https://${this.domain}/jobs?l=${this.params.l}`, {waitUntil: 'domcontentloaded'});

        const lang_el_invalid_location = await this.page.$('.invalid_location p.oocs a');
        const lang_el_message_container = await this.page.$('.messageContainer p.oocs a');

        if(lang_el_invalid_location){
            const indeed_lang_link = await this.page.$eval('.invalid_location p.oocs a', el => el.href);
            this.domain = indeed_lang_link.toLowerCase().replace(/http\:\/\//, "").replace(/\.com\/.*/, ".com");
        }

        if(lang_el_message_container){
            const indeed_lang_link = await this.page.$eval('.messageContainer p.oocs a', el => el.href);
            this.domain = indeed_lang_link.toLowerCase().replace(/http\:\/\//, "").replace(/\.com\/.*/, ".com");
        }

        this.processing = false;
        return this.domain;
    }
    getJobs = async (page=1) => {
        this.processing = true;
        this.buildParams({...this.params, start: (page - 1) * 10})
        await this.page.goto(`https://${this.domain}/jobs?${this.params_str}`);

        const jobs_elements = await this.page.$$('#resultsCol #mosaic-provider-jobcards > a');
        const job_elements_promise = jobs_elements.map(throat(5, job => this.getJobDetail(job)))
        return Promise.all(job_elements_promise).finally(_ => {
            this.processing = false;
        })
    }
    getJobDetail = (job) => {
        const selectors = {
            salary: {query: '.salary-snippet', eval_func: el => el.innerText},
            companyName: {query: '.companyName', eval_func: el => el.innerText},
            title: {query: 'h2.jobTitle > span', eval_func: el => el.innerText},
            companyLocation: {query: '.companyLocation', eval_func: el => el.innerText},
            date: {query: '.date', eval_func: el => el.innerText},
            rating: {query: '.ratingLink .ratingNumber > span', eval_func: el => el.innerText ? Number(el.innerText.replace(',', '.')) : null},
            link: {eval_func: (node, domain) => `https://${domain}/viewjob?jk=${node.dataset.jk}`},
        };

        const selections = Object.entries(selectors).map(([key, selector]) => {
            return new Promise(resolve => {
                if(selector.query){
                    job.$eval(selector.query, selector.eval_func)
                        .then(innerText => resolve({[key]: innerText}))
                        .catch(_ => resolve({[key]: null}))
                }else{
                    job.evaluate(selector.eval_func, this.domain)
                        .then(innerText => resolve({[key]: innerText}))
                        .catch(_ => resolve({[key]: null}))
                }
            })
        })

        return Promise.all(selections).then(selector_values => {
            return Object.assign({}, ...selector_values);
        });
    }
    waitCurrentProcess = () => {
        return new Promise(resolve => {
            const wait_interval = setInterval(() => {
                if(this.processing === false){
                    clearInterval(wait_interval)
                    resolve();
                }
            }, 200)
        })
    }
}


module.exports = Search;