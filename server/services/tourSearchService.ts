export const searchExternalActivities = async (query: string, city: string) => {
  const data = [
    { title: 'Marrakech City Tour', city: 'Marrakech', priceMAD: 180, durationText: '4 heures', rating: 4.5, provider: 'Mock' },
    { title: 'Agafay Desert Day Trip', city: 'Marrakech', priceMAD: 520, durationText: '8 heures', rating: 4.8, provider: 'Mock' },
    { title: 'Ouzoud Waterfalls', city: 'Ouzoud', priceMAD: 450, durationText: '10 heures', rating: 4.6, provider: 'Mock' },
    { title: 'Essaouira Day Trip', city: 'Essaouira', priceMAD: 200, durationText: '9 heures', rating: 4.7, provider: 'Mock' },
  ];
  return data.filter(r =>
    (!query || r.title.toLowerCase().includes(query.toLowerCase())) &&
    (!city || r.city.toLowerCase().includes(city.toLowerCase()))
  );
};
