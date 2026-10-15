export default function handler(_req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'ok',
    app: 'TV Comigo - Watch Party',
    domain: 'tvcomigo.vercel.app',
    url: 'https://tvcomigo.vercel.app',
    platform: 'Vercel',
    version: '2.5.0',
    endpoints: [
      '/api/health',
      '/api/rooms',
      '/api/app-info'
    ],
    timestamp: Date.now()
  });
}

