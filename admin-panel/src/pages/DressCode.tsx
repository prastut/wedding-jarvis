export default function DressCode() {
  const events = [
    {
      name: 'Sangeet / Cocktail Night',
      date: '19th February 2026',
      colors: [
        { name: 'Dusty Rose', hex: '#C27489' },
        { name: 'Pink', hex: '#D8A1AD' },
        { name: 'Blush', hex: '#F2D4DA' },
        { name: 'Forest Green', hex: '#3D5E4C' },
        { name: 'Sage', hex: '#7BA68B' },
        { name: 'Mint', hex: '#8FB996' },
      ],
    },
    {
      name: 'Haldi',
      date: '20th February 2026',
      colors: [
        { name: 'Golden Yellow', hex: '#F5C518' },
        { name: 'Cream', hex: '#FFF8DC' },
        { name: 'Orange', hex: '#E8923A' },
        { name: 'Light Yellow', hex: '#F7DC6F' },
        { name: 'Ivory', hex: '#FFFEF0' },
        { name: 'Mint Green', hex: '#7ED17E' },
      ],
    },
    {
      name: 'Wedding',
      date: '21st February 2026',
      colors: [
        { name: 'Peach', hex: '#E5A088' },
        { name: 'Terracotta', hex: '#B5654A' },
        { name: 'Deep Teal', hex: '#1D4650' },
        { name: 'Light Peach', hex: '#F2C4B3' },
        { name: 'Gold', hex: '#D4A84B' },
        { name: 'Sky Blue', hex: '#5EB4C9' },
        { name: 'Ivory', hex: '#FDF8F0' },
        { name: 'Beige', hex: '#E8D4B8' },
        { name: 'Light Blue', hex: '#E8F4F8' },
        { name: 'Teal', hex: '#7EC8C8' },
        { name: 'Cream', hex: '#FFF8E7' },
        { name: 'Ice Blue', hex: '#EDF8FC' },
      ],
    },
  ];

  return (
    <div className="dress-code-page">
      <div className="dress-code-header">
        <h1>Dress Code</h1>
        <p>Please refer to the suggested color palettes for each event</p>
      </div>

      <div className="events-container">
        {events.map((event) => (
          <div key={event.name} className="event-card">
            <div className="event-info">
              <h2>{event.name}</h2>
              <span className="event-date">{event.date}</span>
            </div>
            <div className="color-palette">
              {event.colors.map((color) => (
                <div key={color.hex} className="color-swatch">
                  <div
                    className="color-box"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="color-name">{color.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="dress-code-footer">
        <p>We can't wait to celebrate with you!</p>
      </div>
    </div>
  );
}
