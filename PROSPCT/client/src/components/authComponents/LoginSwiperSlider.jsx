// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";

const LoginSwiperSlider = ({ slides = [] }) => {
  // If the admin hasn't configured slides yet, render nothing.
  const slidesToRender = Array.isArray(slides) && slides.length > 0 ? slides : [];

  return (
    <Swiper
      spaceBetween={80}
      centeredSlides={false}
      autoplay={{
        delay: 2500,
        disableOnInteraction: false,
      }}
      pagination={{
        clickable: true,
      }}
      modules={[Autoplay, Pagination]}
      className="mySwiper"
    >
      {slidesToRender.map((slide, idx) => (
        <SwiperSlide key={idx}>
          <div className="px-10 mb-10 lg:mt-10">
            <div className=" text-gray-50">{slide.quote}</div>
            <div className="flex justify-center mt-3">
              <div className="rounded-full">
                <img
                  loading="lazy"
                  src={slide.image}
                  className="w-12 h-12 mr-4 rounded-full"
                  alt={slide.name}
                />
              </div>
              <div className="text-start">
                <div className="text-sm font-semibold text-yellow-400">
                  {slide.name}
                </div>
                <div className="text-[13px] text-gray-50 font-extralight">
                  {slide.title}
                </div>
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default LoginSwiperSlider;
