import HeroSection from "@/components/layout/hero-section";
import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import Testimonials from "@/components/layout/testimonials";
import ComingSoon from "@/components/movie/coming-soon";
import FeaturedMovies from "@/components/movie/featured-movies";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "XCounter - Your Ultimate Movie Booking Experience",
  description: "Book tickets for the latest movies with ease, enjoy premium viewing experiences, and more.",
};

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />

        <section className="py-16 bg-white">
          <div className="container">
            <h2 className="text-3xl font-display font-bold text-center mb-12">Now Playing</h2>
            <FeaturedMovies />
            <div className="mt-12 text-center">
              <Link href="/movies" className="btn btn-primary btn-lg">
                View All Movies
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="container">
            <h2 className="text-3xl font-display font-bold text-center mb-12">Coming Soon</h2>
            <ComingSoon />
          </div>
        </section>

        <section className="py-16 bg-primary-900 text-white">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-display font-bold mb-6">Premium Movie Experience</h2>
              <p className="text-lg mb-8">
                Upgrade to our premium theaters for the ultimate movie experience with luxurious seating,
                state-of-the-art sound systems, and exclusive perks.
              </p>
              <Link href="/premium" className="btn bg-white text-primary-900 hover:bg-gray-100 btn-lg">
                Discover Premium
              </Link>
            </div>
          </div>
        </section>

        <Testimonials />
      </main>
      <SiteFooter />
    </div>
  );
}
