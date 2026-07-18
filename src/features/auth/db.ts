import { getCloudflareContext } from "@opennextjs/cloudflare";
export async function getEnv() { return (await getCloudflareContext({ async: true })).env; }
export async function getDb() { return (await getEnv()).DB; }
