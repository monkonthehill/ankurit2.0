import React, { useState, useEffect } from 'react';
import './Slideshow.css';

const slides = [
  {
    id: 1,
    title: 'किसान की शक्ति, अंकुरित की पहल',
    description: 'भारत के हर कोने से विश्वसनीय नर्सरी और खरीदारों को जोड़ने वाला मंच।',
    image: '/pictures/farmer.jpg',
  },
  {
    id: 2,
    title: 'बेहतर खेती की शुरुआत यहीं से',
    description: 'किसानों को जोड़ता है सीधे नर्सरी मालिकों से – पारदर्शी और आसान।',
    image: '/pictures/nursery.jpg',
  },
  {
    id: 3,
    title: 'सपनों की फसल बोने का समय',
    description: 'अपने खेत और प्रोडक्ट को पूरे भारत तक पहुंचाएं।',
    image: '/pictures/market.png',
  },
];

const Slideshow = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="ankurit-slideshow">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`slide ${index === current ? 'active' : ''}`}
          style={{ backgroundImage: `url(${slide.image})` }}
        >
          <div className="overlay">
            <div className="text-box">
              <h2>{slide.title}</h2>
              <p>{slide.description}</p>
            </div>
          </div>
        </div>
      ))}

      <div className="dots">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`dot ${index === current ? 'active' : ''}`}
          ></button>
        ))}
      </div>
    </section>
  );
};

export default Slideshow;
