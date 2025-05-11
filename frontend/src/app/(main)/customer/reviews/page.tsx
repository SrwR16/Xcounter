"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Review types
interface Review {
  id: string;
  movieId: string;
  movieTitle: string;
  moviePoster: string;
  rating: number;
  content: string;
  createdAt: string;
  showId?: string;
}

// Form schema
const reviewSchema = z.object({
  movieId: z.string().min(1, "Please select a movie"),
  rating: z.number().min(1, "Please select a rating").max(5, "Maximum rating is 5"),
  content: z.string().min(5, "Review must be at least 5 characters").max(500, "Review must be at most 500 characters"),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

export default function ReviewsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Fetch user reviews
  const {
    data: reviews,
    isLoading: isLoadingReviews,
    refetch,
  } = useQuery({
    queryKey: ["userReviews"],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data
      return [
        {
          id: "rev1",
          movieId: "movie1",
          movieTitle: "The Avengers",
          moviePoster: "https://picsum.photos/200/300?random=1",
          rating: 5,
          content:
            "Absolutely loved this movie! The action scenes were incredible and the character development was spot on.",
          createdAt: "2025-02-15T14:22:33Z",
        },
        {
          id: "rev2",
          movieId: "movie2",
          movieTitle: "Inception",
          moviePoster: "https://picsum.photos/200/300?random=2",
          rating: 4,
          content:
            "Mind-bending plot with amazing visuals. Christopher Nolan at his best. The ending left me thinking for days.",
          createdAt: "2025-01-20T09:15:42Z",
        },
      ] as Review[];
    },
    enabled: !!user,
  });

  // Fetch recently watched movies (for adding new reviews)
  const { data: recentMovies, isLoading: isLoadingMovies } = useQuery({
    queryKey: ["recentMovies"],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock data
      return [
        {
          id: "movie3",
          title: "Dune",
          poster: "https://picsum.photos/200/300?random=3",
        },
        {
          id: "movie4",
          title: "No Time To Die",
          poster: "https://picsum.photos/200/300?random=4",
        },
        {
          id: "movie5",
          title: "Shang-Chi",
          poster: "https://picsum.photos/200/300?random=5",
        },
      ];
    },
    enabled: !!user && showForm,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      movieId: "",
      rating: 0,
      content: "",
    },
  });

  const selectedRating = watch("rating");
  const selectedMovieId = watch("movieId");

  // Handle form submission
  const onSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real app, you would send the review data to your API
      console.log("Submitting review:", data);

      // Reset form and state
      reset();
      setEditingReview(null);
      setShowForm(false);
      setSuccessMessage(editingReview ? "Review updated successfully!" : "Review submitted successfully!");

      // Refetch reviews to show the new one
      refetch();
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setShowForm(true);

    // Set form values
    setValue("movieId", review.movieId);
    setValue("rating", review.rating);
    setValue("content", review.content);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // In a real app, you would send a delete request to your API
      console.log("Deleting review:", reviewId);

      // Show success message
      setSuccessMessage("Review deleted successfully!");

      // Refetch reviews
      refetch();
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  const handleAddReview = () => {
    setEditingReview(null);
    setShowForm(true);
    reset();
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingReview(null);
    reset();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  // If not authenticated, redirect to login
  if (!authLoading && !user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <main className="py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">My Reviews</h1>
              <p className="mt-1 text-sm text-gray-500">Manage your movie reviews and ratings</p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              {!showForm && (
                <button
                  type="button"
                  onClick={handleAddReview}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <svg
                    className="-ml-1 mr-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Add Review
                </button>
              )}
            </div>
          </div>

          {successMessage && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {showForm ? (
            <div className="bg-white shadow sm:rounded-lg mb-8">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {editingReview ? "Edit Review" : "Add New Review"}
                </h3>
                <div className="mt-5">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {!editingReview && (
                      <div>
                        <label htmlFor="movieId" className="block text-sm font-medium text-gray-700">
                          Select Movie
                        </label>
                        <div className="mt-1">
                          {isLoadingMovies ? (
                            <div className="flex justify-center p-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {recentMovies?.map((movie) => (
                                <div
                                  key={movie.id}
                                  onClick={() => setValue("movieId", movie.id)}
                                  className={`cursor-pointer border rounded-md overflow-hidden ${
                                    selectedMovieId === movie.id ? "ring-2 ring-primary-500" : "hover:bg-gray-50"
                                  }`}
                                >
                                  <div className="aspect-w-2 aspect-h-3 relative h-48">
                                    <Image src={movie.poster} alt={movie.title} fill className="object-cover" />
                                  </div>
                                  <div className="p-2 text-center">
                                    <p className="text-sm font-medium text-gray-900 truncate">{movie.title}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <input type="hidden" {...register("movieId")} />
                          {errors.movieId && <p className="mt-2 text-sm text-red-600">{errors.movieId.message}</p>}
                        </div>
                      </div>
                    )}

                    <div>
                      <label htmlFor="rating" className="block text-sm font-medium text-gray-700">
                        Rating
                      </label>
                      <div className="mt-1 flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setValue("rating", rating)}
                            className="focus:outline-none"
                          >
                            <svg
                              className={`h-8 w-8 ${rating <= selectedRating ? "text-yellow-400" : "text-gray-300"}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                        <input type="hidden" {...register("rating", { valueAsNumber: true })} />
                      </div>
                      {errors.rating && <p className="mt-2 text-sm text-red-600">{errors.rating.message}</p>}
                    </div>

                    <div>
                      <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                        Review
                      </label>
                      <div className="mt-1">
                        <textarea
                          rows={4}
                          className={`shadow-sm block w-full sm:text-sm border-gray-300 rounded-md ${
                            errors.content ? "border-red-300" : ""
                          }`}
                          placeholder="Write your review here..."
                          {...register("content")}
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Write your thoughts about the movie. Min 5 characters, max 500 characters.
                      </p>
                      {errors.content && <p className="mt-2 text-sm text-red-600">{errors.content.message}</p>}
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={handleCancelForm}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        ) : null}
                        {editingReview ? "Update Review" : "Submit Review"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : null}

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Your Reviews</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Reviews you've written for movies you've watched</p>
            </div>

            {isLoadingReviews ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : reviews && reviews.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {reviews.map((review) => (
                  <li key={review.id} className="p-4 sm:p-6">
                    <div className="sm:flex sm:items-start">
                      <div className="sm:flex-shrink-0 mb-4 sm:mb-0">
                        <div className="relative h-24 w-16 sm:h-32 sm:w-24 rounded overflow-hidden">
                          <Image src={review.moviePoster} alt={review.movieTitle} fill className="object-cover" />
                        </div>
                      </div>
                      <div className="sm:ml-6 flex-1">
                        <h4 className="text-lg font-bold text-gray-900">{review.movieTitle}</h4>
                        <div className="flex items-center mt-1">
                          <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <svg
                                key={index}
                                className={`h-5 w-5 ${index < review.rating ? "text-yellow-400" : "text-gray-300"}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="ml-2 text-sm text-gray-500">{formatDate(review.createdAt)}</span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-gray-700">{review.content}</p>
                        </div>
                        <div className="mt-4 flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => handleEditReview(review)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(review.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  ></path>
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You haven't written any reviews yet. Start by adding a review for a movie you've watched.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleAddReview}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <svg
                      className="-ml-1 mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Add Review
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
