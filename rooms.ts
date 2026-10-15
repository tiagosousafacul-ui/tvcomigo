export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json([
    {
      id: 'rave-brasil',
      title: 'Sala Principal TV Comigo',
      participantCount: 1,
      currentMedia: {
        id: 'top10-daily',
        title: 'Top 10 Brasil • TV Comigo',
        url: '',
        type: 'video',
        service: 'netflix',
        poster: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&auto=format&fit=crop&q=80',
        category: 'Top 10',
      },
      isPlaying: false,
      createdAt: Date.now(),
    },
  ]);
}
