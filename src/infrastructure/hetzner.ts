import { LocalWorkspace, InlineProgramArgs } from "@pulumi/pulumi/automation";
// import { Server } from './proxyServer';
import * as pulumi from "@pulumi/pulumi";
import * as hcloud from "@pulumi/hcloud";
import * as fs from 'fs';

const projectName = "michelin-scraper";
const stackName = "dev";
const proxyCount = 9;
const sshKeys = ["My SSH key"];

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function getProxyUrls(servers: hcloud.Server[], proxyUser: string, proxyPassword: string): Promise<string[]> {
  const serverIpsOutput = servers.map((server: hcloud.Server) => server.ipv4Address);
  const allServerIps = pulumi.all(serverIpsOutput);
  const proxyUrlsPromise = new Promise<string[]>((resolve) => {
    allServerIps.apply((ips) => {
      const proxyUrls = ips.map((ip) => `http://${proxyUser}:${proxyPassword}@${ip}:8888`);
      resolve(proxyUrls);
    });
  });

  return proxyUrlsPromise;
}

export async function hetznerCloud(status: "up" | "destroy") {

  const hcloudToken = process.env.HCLOUD_TOKEN || "";
  const servers: hcloud.Server[] = [];
  const proxyUser = process.env.PROXY_USER || "scraper";
  const proxyPassword = process.env.PROXY_PASSWORD || "scraper";
  const program = async () => {

    const userDataScript = fs.readFileSync("./src/infrastructure/user_data.sh", "utf-8");
    const interpolatedUserData = pulumi.interpolate `${userDataScript.replace(/\$\{PROXY_USER\}/g, proxyUser).replace(/\$\{PROXY_PASSWORD\}/g, proxyPassword)}`;

    for (const range = {value: 0}; range.value < proxyCount; range.value++) {
      servers.push(new hcloud.Server(`scrape-proxy-${range.value}`, {
        serverType: "cx11",
        image: "debian-11",
        location: "fsn1",
        sshKeys: sshKeys,
        userData: interpolatedUserData,
      }));
    }
  };

  const args: InlineProgramArgs = {
    stackName,
    projectName,
    program,
  };
  const stack = await LocalWorkspace.createOrSelectStack(args);
  await stack.setConfig("hcloud:token", { value: hcloudToken });

  if (status === "destroy") {
    console.info("Pulumi: destroying stack...");
    await stack.destroy({ onOutput: console.info });
    console.info("Pulumi: stack destroy complete");
    process.exit(0);
  }

  await stack.up({ onOutput: console.log });
  console.info("Pulumi: stack started");

  const proxyUrls = await getProxyUrls(servers, proxyUser, proxyPassword);
  await sleep(30000);
  console.log("Proxy URLs:", proxyUrls);
  return proxyUrls;
}
