export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const host = req.headers['host'] || 'tvcomigo.vercel.app';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  res.status(200).json({
    domain: 'tvcomigo.vercel.app',
    officialUrl: 'https://tvcomigo.vercel.app',
    sharedUrl: 'https://tvcomigo.vercel.app',
    currentUrl: `${proto}://${host}`,
    platform: 'vercel',
  });
}

