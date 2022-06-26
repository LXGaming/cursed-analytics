# Cursed Analytics

[![License](https://img.shields.io/github/license/LXGaming/cursed-analytics?label=License&cacheSeconds=86400)](https://github.com/LXGaming/cursed-analytics/blob/main/LICENSE)

**Cursed Analytics** is a cursed way of obtaining project analytic data from [CurseForge](https://www.curseforge.com/) with minimal user interaction.

Special thanks to [jaredlll08](https://github.com/jaredlll08) for creating [CurseForge-Stats](https://github.com/jaredlll08/CurseForge-Stats) which inspired the creation of this project.

It's unfortunate [CurseForge](https://www.curseforge.com/) is locking down their website without providing a means for developers to access analytic data especially since they have the ability to add such functionality to the [CurseForge API](https://support.curseforge.com/en/support/solutions/articles/9000197321-curseforge-api).

## Why [Electron](https://www.electronjs.org/)?
Due to [CurseForge](https://www.curseforge.com/) switching [Cloudflare](https://www.cloudflare.com/) from `JS Challenge` to `Challenge (Captcha)` it makes it significantly more difficult too autonomously collect project analytic data, a potential solution to this would require using dodgy 3rd party services to bypass Captcha.

[Electron](https://www.electronjs.org/) gives us the ability to scrape the project analytics and if we encounter a Captcha we can simply have the end user solve it, this isn't a perfect solution but considering the alternatives it's not a bad trade off.

## Prerequisites
- [Grafana](https://grafana.com/) ([Pre-Built Dashboard](https://github.com/jaredlll08/CurseForge-Stats/blob/master/grafana-dash.json))
- [MariaDB](https://mariadb.org/) or [MySQL](https://www.mysql.com/)

## Usage
```
npm install
npm run start
```

## License
Cursed Analytics is licensed under the [Apache 2.0](https://github.com/LXGaming/cursed-analytics/blob/main/LICENSE) license.