import { Hero } from "@/components/sections/hero";
import { AboutUs } from "@/components/sections/about-us";
import { PopularFoods } from "@/components/sections/popular-foods";
import { Trending } from "@/components/sections/trending";
import { FeaturedDishes } from "@/components/sections/featured-dishes";
import { ChefRecommendation } from "@/components/sections/chef-recommendation";
import { Testimonials } from "@/components/sections/testimonials";
import { GalleryPreview } from "@/components/sections/gallery-preview";
import { LatestBlog } from "@/components/sections/latest-blog";
import { HomeFaq } from "@/components/sections/home-faq";
import { Subscribe } from "@/components/sections/subscribe";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedDishes />
      <AboutUs />
      <PopularFoods />
      <ChefRecommendation />
      <Trending />
      <Testimonials />
      <GalleryPreview />
      <LatestBlog />
      <HomeFaq />
      <Subscribe />
    </>
  );
}
