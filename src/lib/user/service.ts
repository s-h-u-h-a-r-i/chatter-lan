export async function fetchPublicIp(): Promise<string> {
  const services = [
    'https://api.ipify.org?format=json',
    'https://api64.ipify.org?format=json',
    'https://ipapi.co/json/',
  ] as const;

  for (const url of services) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const ip = data.ip || data.query;

      if (ip && typeof ip === 'string') {
        return ip;
      }
    } catch (error) {
      continue;
    }
  }

  throw new Error(`Failed to fetch IP from ${services.length} services`);
}
