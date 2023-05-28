# Michelin Guide scraper

## Disclaimer
The scraping application made available on this GitHub repository is designed to scrape data from the Michelin Restaurants Guide. It is crucial to understand that the ownership, copyright, and all other intellectual property rights in and to the data obtained through the use of this application belong to Michelin and their respective partners.

This application has been developed for educational and research purposes only, to demonstrate the potential of web scraping technologies. The creator of this application does not endorse or promote the unauthorized use of scraped data in any way. It is the user's responsibility to use the data obtained through this application in compliance with the terms and conditions of the Michelin Restaurants Guide, and all applicable laws and regulations.

The creator of this application does not claim any rights over the data obtained through this application, nor provides any warranty regarding the accuracy, completeness, or reliability of such data. Users are advised to refer to the source for the most accurate and up-to-date information.

By using this application, users acknowledge that any data obtained and/or used is at their own risk and discretion.

## Background
Michelin does not have an official API so data should be scraped if you would like to use it as the dataset.
This project was inspired by https://github.com/ngshiheng/michelin-my-maps, but the difference is it uses Scrapy to scrape, PostgreSQL database to store data, and Hetzner Cloud through Pulumi to spin up proxy infrastructure.

## Running the scraper

1. Create Pulumi account at https://app.pulumi.com. Then create a project and stack.
2. Generate API token in Pulumi
3. Ensure PostgreSQL database is up and running. I'm using cloud [Neon](https://neon.tech) database which comes with a generous free plan
4. Create Hetzner Cloud account and generate API token
5. Install packages with `npm install`
6. Install Prisma with `npm i -g prisma@latest`
7. Create `.env` file or export the following environment variables:

    ```
    DATABASE_URL="postgres://<user>:<password>@<host>"
    DIRECT_URL="postgres://<user>:<password>@<host>" # Required if using Neon
    PROXY_USER="<proxy user>"
    PROXY_PASSWORD="<proxy password>"
    HCLOUD_TOKEN="<Hetzner Cloud token>"
    PULUMI_ACCESS_TOKEN="<Pulumi Token>"
    ```
8. Initialise Prisma client and run Prisma migrations with `prisma generate && prisma migrate deploy`
9. Run scraper with `npm run start`
