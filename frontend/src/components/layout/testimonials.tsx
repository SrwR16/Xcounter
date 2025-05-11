export default function Testimonials() {
  const testimonials = [
    {
      content: "XCounter has completely changed how I watch movies. The premium theaters are worth every penny!",
      author: "Sarah Johnson",
      role: "Movie Enthusiast",
      imageSrc: "/images/testimonial-1.jpg",
    },
    {
      content: "I love how easy it is to book tickets and find my favorite movies. The mobile app is fantastic!",
      author: "Michael Chen",
      role: "Regular Customer",
      imageSrc: "/images/testimonial-2.jpg",
    },
    {
      content: "Their customer service is outstanding. I had an issue with my booking and it was resolved immediately.",
      author: "Emily Rodriguez",
      role: "Film Lover",
      imageSrc: "/images/testimonial-3.jpg",
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-display font-bold tracking-tight text-gray-900 sm:text-4xl">
            What Our Customers Say
          </h2>
          <p className="mt-4 text-lg leading-8 text-gray-600">
            Discover why movie lovers choose XCounter for their cinema experiences.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="flex flex-col justify-between bg-white p-6 shadow-lg ring-1 ring-gray-900/5 rounded-lg"
            >
              <div>
                <div className="flex items-center gap-x-2">
                  <div className="h-10 w-10 rounded-full bg-gray-300 overflow-hidden">
                    {/* If in production, use real images */}
                    <div className="h-full w-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                      {testimonial.author[0]}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold leading-7 tracking-tight text-gray-900">{testimonial.author}</h3>
                    <p className="text-sm leading-6 text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <blockquote className="mt-6 text-base leading-7 text-gray-700">
                  <p>"{testimonial.content}"</p>
                </blockquote>
              </div>
              <div className="mt-6 flex justify-between border-t border-gray-200 pt-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-5 w-5 ${i < 5 ? "text-primary-500" : "text-gray-300"}`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ))}
                </div>
                <p className="text-sm leading-6 text-gray-500">Verified Customer</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
