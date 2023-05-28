import { CheerioCrawler, ProxyConfiguration, EnqueueStrategy } from 'crawlee';
import { PrismaClient, Restaurant } from '@prisma/client';
import { hetznerCloud } from './infrastructure/hetzner';

async function main() {
  const proxyConfiguration = new ProxyConfiguration({
    proxyUrls: await hetznerCloud("up")
  });

  const crawler = new CheerioCrawler({
    proxyConfiguration,
    ignoreSslErrors: true,
    minConcurrency: 10,
    maxConcurrency: 90,
    maxRequestsPerCrawl: 20000,
    maxRequestRetries: 3,
    maxRequestsPerMinute: 900,
    async requestHandler({ request, $, log, response, enqueueLinks }) {
      await enqueueLinks({
        strategy: EnqueueStrategy.SameDomain,
        regexps: [
          /https:\/\/guide\.michelin\.com\/en\/[\w-]+\/[\w-]+\/restaurant\/[\w-]+$/gi,
          /https:\/\/guide\.michelin\.com\/en\/restaurants\/page\/[\d-]+/gi
        ]
      });
      log.info(request.url)
      const title = $('h1').text();
      const address = $('li[class$="address"]:first').text().trim();
      const [price, type] = $('li[class$="price"] span:first').text().split('·').map((item) => item.trim()) as [string, string];
      const metaElement = $('.restaurant-details__likeinfo.js-favorite-restaurant');
      const id = parseInt(metaElement.attr('data-pid') || "0", 10);
      const distinction = metaElement.attr('data-dtm-distinction');
      const city = metaElement.attr('data-dtm-city');
      const district = metaElement.attr('data-dtm-district');
      const region = metaElement.attr('data-dtm-region');
      const countryCode = metaElement.attr('data-restaurant-country');
      const chef = metaElement.attr('data-dtm-chef');
      const selection = metaElement.attr('data-restaurant-selection');
      const facilities = $('div[class$="services"]').text().trim().split('\n').map((item) => item.trim()).filter((item) => item !== '');
      const phone = $('a[data-event="CTA_tel"]').attr('href')?.replace('tel:', '');
      const website = $('a[data-event="CTA_website"]').attr('href');
      const googleMaps = $('div.restaurant-details__button--mobile a').attr('href') || 'fake&lat=0&lon=0';
      const mapsQueryString = googleMaps.split('?')[1];
      const urlSearchParams = new URLSearchParams(mapsQueryString);
      const latString = urlSearchParams.get('lat');
      const lonString = urlSearchParams.get('lon');
      const latitude = latString ? parseFloat(latString) : 0;
      const longitude = lonString ? parseFloat(lonString) : 0;
      const url = request.url;

      if (response.statusCode == 200 && !url.includes("restaurants")) {
        upsertRestaurant({
          id: id,
          title: title,
          address: address,
          price: price,
          type: type,
          distinction: distinction,
          city: city,
          district: district,
          region: region,
          countryCode: countryCode,
          chef: chef,
          selection: selection,
          facilities: facilities.join(','),
          phone: phone,
          website: website,
          latitude: latitude,
          longitude: longitude,
          url: url,
        });
      }
    },

    async failedRequestHandler({ request, log }) {
      log.error(`Request ${request.url} failed.`);
      await prisma.error.create({
        data: {
          url: request.url,
          message: "Request failed",
        },
      });
    },
  });
  await crawler.run(['https://guide.michelin.com/en/restaurants']);
}

async function upsertRestaurant(restaurantData: Partial<Restaurant>): Promise<Restaurant | null> {
  const existingRestaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantData.id },
  });

  if (existingRestaurant) {
    const hasChanged = Object.keys(restaurantData).some((key) => {
      // @ts-ignore
      return restaurantData[key] !== existingRestaurant[key];
    });

    const data = hasChanged ? { ...restaurantData, updatedAt: new Date(), scrapedAt: new Date() } : { scrapedAt: new Date() };
    return await prisma.restaurant.update({
      where: { id: restaurantData.id },
      data: data,
    });
  } else {
    // If the restaurant does not exist in the database, create a new one
    return await prisma.restaurant.create({
      // @ts-ignore
      data: { ...restaurantData, updatedAt: new Date(), scrapedAt: new Date()},
    });
  }
}

const prisma = new PrismaClient();
main().catch((err) => console.error('Error in main:', err));
hetznerCloud("destroy");
