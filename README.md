> For educational purposes only.

A script that runs on a headless browser to fetch jobs from indeed.com.

## Install & run

```bash
npm i
node index.js
```

## Usage

It has only one endpoint: `/:location/:page`. After providing the location and page parameters, the service will return `total`, `page` and `jobs` elements. According to the value of `total`, the page value can be increased to get more.

For searching with other parameters such as posting date or job type, they should be added as URL parameters.

## Some parameters

| Query parameter | Desc | Example |
| --------------- | --------------- | --------------- |
| **q** | searching in the title of jobs | q=QA engineer |
| **fromage** | jobs posted in the last X days | fromage=1 |
| **jt** | job types | jt=permanent |

> The query parameters can be taken from the site. Just apply some filters and copy the whole URL parameters, except the location (`?l=`) value, then use it.
