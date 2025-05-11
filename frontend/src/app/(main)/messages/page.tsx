"use client";

import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { useAuth } from "@/components/providers/auth-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Message types
interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar: string;
    role: "customer" | "admin" | "moderator" | "salesman";
  };
  receiver: {
    id: string;
    name: string;
    avatar: string;
    role: "customer" | "admin" | "moderator" | "salesman";
  };
  timestamp: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    avatar: string;
    role: "customer" | "admin" | "moderator" | "salesman";
  }[];
  lastMessage: {
    content: string;
    timestamp: string;
    sender: string;
  };
  unreadCount: number;
}

// Form schema
const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(500, "Message is too long"),
});

type MessageFormData = z.infer<typeof messageSchema>;

export default function MessagesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations, isLoading: isLoadingConversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data
      return [
        {
          id: "conv1",
          participants: [
            {
              id: "user123",
              name: "John Doe",
              avatar: "/avatars/johndoe.jpg",
              role: "customer",
            },
            {
              id: "admin1",
              name: "Admin User",
              avatar: "/avatars/admin.jpg",
              role: "admin",
            },
          ],
          lastMessage: {
            content: "Yes, we can process that refund for you.",
            timestamp: "2025-03-12T09:43:21Z",
            sender: "admin1",
          },
          unreadCount: 0,
        },
        {
          id: "conv2",
          participants: [
            {
              id: "user123",
              name: "John Doe",
              avatar: "/avatars/johndoe.jpg",
              role: "customer",
            },
            {
              id: "mod2",
              name: "Support Team",
              avatar: "/avatars/support.jpg",
              role: "moderator",
            },
          ],
          lastMessage: {
            content: "Do you have any special accessibility requirements?",
            timestamp: "2025-03-10T15:22:53Z",
            sender: "mod2",
          },
          unreadCount: 1,
        },
      ] as Conversation[];
    },
    enabled: !!user,
  });

  // Fetch messages for active conversation
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["messages", activeConversation],
    queryFn: async () => {
      if (!activeConversation) return [];

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock data
      if (activeConversation === "conv1") {
        return [
          {
            id: "msg1",
            content: "Hello, I would like to request a refund for my booking #12345.",
            sender: {
              id: "user123",
              name: "John Doe",
              avatar: "/avatars/johndoe.jpg",
              role: "customer",
            },
            receiver: {
              id: "admin1",
              name: "Admin User",
              avatar: "/avatars/admin.jpg",
              role: "admin",
            },
            timestamp: "2025-03-12T09:35:42Z",
            isRead: true,
          },
          {
            id: "msg2",
            content: "Hi John, I'm checking your booking details now. May I know the reason for the refund request?",
            sender: {
              id: "admin1",
              name: "Admin User",
              avatar: "/avatars/admin.jpg",
              role: "admin",
            },
            receiver: {
              id: "user123",
              name: "John Doe",
              avatar: "/avatars/johndoe.jpg",
              role: "customer",
            },
            timestamp: "2025-03-12T09:38:15Z",
            isRead: true,
          },
          {
            id: "msg3",
            content: "I have a medical emergency and won't be able to attend.",
            sender: {
              id: "user123",
              name: "John Doe",
              avatar: "/avatars/johndoe.jpg",
              role: "customer",
            },
            receiver: {
              id: "admin1",
              name: "Admin User",
              avatar: "/avatars/admin.jpg",
              role: "admin",
            },
            timestamp: "2025-03-12T09:40:33Z",
            isRead: true,
          },
          {
            id: "msg4",
            content:
              "I understand. I can see your booking is eligible for a full refund as per our policy for medical emergencies.",
            sender: {
              id: "admin1",
              name: "Admin User",
              avatar: "/avatars/admin.jpg",
              role: "admin",
            },
            receiver: {
              id: "user123",
              name: "John Doe",
              avatar: "/avatars/johndoe.jpg",
              role: "customer",
            },
            timestamp: "2025-03-12T09:42:01Z",
            isRead: true,
          },
          {
            id: "msg5",
            content: "Thank you! How long will it take to process?",
            sender: {
              id: "user123",
              name: "John Doe",
              avatar: "/avatars/johndoe.jpg",
              role: "customer",
            },
            receiver: {
              id: "admin1",
              name: "Admin User",
              avatar: "/avatars/admin.jpg",
              role: "admin",
            },
            timestamp: "2025-03-12T09:42:45Z",
            isRead: true,
          },
          {
            id: "msg6",
            content:
              "Yes, we can process that refund for you. It will take 3-5 business days to appear in your account.",
            sender: {
              id: "admin1",
              name: "Admin User",
              avatar: "/avatars/admin.jpg",
              role: "admin",
            },
            receiver: {
              id: "user123",
              name: "John Doe",
              avatar: "/avatars/johndoe.jpg",
              role: "customer",
            },
            timestamp: "2025-03-12T09:43:21Z",
            isRead: true,
          },
        ] as Message[];
      } else if (activeConversation === "conv2") {
        return [
          {
            id: "msg7",
            content:
              "Hello, I'm planning to book tickets for a group with a wheelchair user. Do you have accessible seating?",
            sender: {
              id: "user123",
              name: "John Doe",
              avatar: "/avatars/johndoe.jpg",
              role: "customer",
            },
            receiver: {
              id: "mod2",
              name: "Support Team",
              avatar: "/avatars/support.jpg",
              role: "moderator",
            },
            timestamp: "2025-03-10T15:15:22Z",
            isRead: true,
          },
          {
            id: "msg8",
            content:
              "Hi John, yes we do have wheelchair accessible seating in all our theaters. How many people are in your group?",
            sender: {
              id: "mod2",
              name: "Support Team",
              avatar: "/avatars/support.jpg",
              role: "moderator",
            },
            receiver: {
              id: "user123",
              name: "John Doe",
              avatar: "/avatars/johndoe.jpg",
              role: "customer",
            },
            timestamp: "2025-03-10T15:18:45Z",
            isRead: true,
          },
          {
            id: "msg9",
            content: "We will be a group of 5 people including the wheelchair user.",
            sender: {
              id: "user123",
              name: "John Doe",
              avatar: "/avatars/johndoe.jpg",
              role: "customer",
            },
            receiver: {
              id: "mod2",
              name: "Support Team",
              avatar: "/avatars/support.jpg",
              role: "moderator",
            },
            timestamp: "2025-03-10T15:20:12Z",
            isRead: true,
          },
          {
            id: "msg10",
            content:
              "Great! I can reserve accessible seating for your group. We have space in row J that keeps your group together next to the wheelchair spot.",
            sender: {
              id: "mod2",
              name: "Support Team",
              avatar: "/avatars/support.jpg",
              role: "moderator",
            },
            receiver: {
              id: "user123",
              name: "John Doe",
              avatar: "/avatars/johndoe.jpg",
              role: "customer",
            },
            timestamp: "2025-03-10T15:21:38Z",
            isRead: true,
          },
          {
            id: "msg11",
            content: "That sounds perfect. Thank you!",
            sender: {
              id: "user123",
              name: "John Doe",
              avatar: "/avatars/johndoe.jpg",
              role: "customer",
            },
            receiver: {
              id: "mod2",
              name: "Support Team",
              avatar: "/avatars/support.jpg",
              role: "moderator",
            },
            timestamp: "2025-03-10T15:22:05Z",
            isRead: true,
          },
          {
            id: "msg12",
            content: "Do you have any special accessibility requirements?",
            sender: {
              id: "mod2",
              name: "Support Team",
              avatar: "/avatars/support.jpg",
              role: "moderator",
            },
            receiver: {
              id: "user123",
              name: "John Doe",
              avatar: "/avatars/johndoe.jpg",
              role: "customer",
            },
            timestamp: "2025-03-10T15:22:53Z",
            isRead: false,
          },
        ] as Message[];
      }

      return [] as Message[];
    },
    enabled: !!activeConversation && !!user,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: "",
    },
  });

  // Scroll to bottom of messages on load and new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle form submission
  const onSubmit = async (data: MessageFormData) => {
    if (!activeConversation) return;

    setIsSending(true);

    try {
      // Simulate API call to send message
      await new Promise((resolve) => setTimeout(resolve, 500));

      // In a real app, you would send the message via API
      // and then refetch or update the message list

      // Reset form
      reset();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Get other participant in conversation
  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find((p) => p.id !== user?.id) || conversation.participants[0];
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Format date
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
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
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Messages</h1>
              <p className="mt-1 text-sm text-gray-500">Communicate with support staff about bookings and inquiries</p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                type="button"
                onClick={() => setActiveConversation(null)}
                className={`${!activeConversation ? "hidden" : ""} inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 md:hidden`}
              >
                Back to Conversations
              </button>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg min-h-[600px]">
            <div className="h-full flex">
              {/* Conversation List (hidden on mobile when conversation is active) */}
              <div
                className={`w-full md:w-1/3 border-r border-gray-200 ${activeConversation ? "hidden md:block" : ""}`}
              >
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Your Conversations</h2>
                </div>

                {isLoadingConversations ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                ) : conversations && conversations.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {conversations.map((conversation) => {
                      const otherParticipant = getOtherParticipant(conversation);
                      return (
                        <li
                          key={conversation.id}
                          className={`p-4 hover:bg-gray-50 cursor-pointer ${
                            activeConversation === conversation.id ? "bg-gray-50" : ""
                          }`}
                          onClick={() => setActiveConversation(conversation.id)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0 relative">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                                {otherParticipant.name.charAt(0)}
                              </div>
                              {conversation.unreadCount > 0 && (
                                <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-primary-600 ring-2 ring-white"></span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 truncate">{otherParticipant.name}</p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(conversation.lastMessage.timestamp)}
                                </p>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-500 truncate">
                                  {conversation.lastMessage.sender === user?.id
                                    ? `You: ${conversation.lastMessage.content}`
                                    : conversation.lastMessage.content}
                                </p>
                                {conversation.unreadCount > 0 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                                    {conversation.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="p-8 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No conversations</h3>
                    <p className="mt-1 text-sm text-gray-500">You haven't started any conversations yet.</p>
                    <div className="mt-6">
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        onClick={() => alert("This would open a new conversation dialog in a real app")}
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
                        New Conversation
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Message View */}
              <div className={`w-full md:w-2/3 h-[600px] flex flex-col ${!activeConversation ? "hidden md:flex" : ""}`}>
                {activeConversation ? (
                  <>
                    {/* Conversation Header */}
                    <div className="flex items-center p-4 border-b border-gray-200">
                      <div className="flex-shrink-0 mr-3">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                          {conversations?.find((c) => c.id === activeConversation)
                            ? getOtherParticipant(conversations.find((c) => c.id === activeConversation)!).name.charAt(
                                0
                              )
                            : "?"}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-medium text-gray-900">
                          {conversations?.find((c) => c.id === activeConversation)
                            ? getOtherParticipant(conversations.find((c) => c.id === activeConversation)!).name
                            : "Loading..."}
                        </h2>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto">
                      {isLoadingMessages ? (
                        <div className="flex justify-center p-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                        </div>
                      ) : messages && messages.length > 0 ? (
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.sender.id === user?.id ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${
                                  message.sender.id === user?.id
                                    ? "bg-primary-600 text-white"
                                    : "bg-gray-100 text-gray-900"
                                }`}
                              >
                                <div className="text-sm">{message.content}</div>
                                <div
                                  className={`text-xs mt-1 ${
                                    message.sender.id === user?.id ? "text-primary-100" : "text-gray-500"
                                  }`}
                                >
                                  {formatTimestamp(message.timestamp)}
                                </div>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-gray-500">No messages yet</p>
                        </div>
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-gray-200">
                      <form onSubmit={handleSubmit(onSubmit)} className="flex space-x-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                              errors.content ? "border-red-300" : ""
                            }`}
                            placeholder="Type your message..."
                            {...register("content")}
                            disabled={isSending}
                          />
                          {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
                        </div>
                        <button
                          type="submit"
                          disabled={isSending}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                        >
                          {isSending ? (
                            <svg
                              className="animate-spin h-5 w-5 text-white"
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
                          ) : (
                            <svg
                              className="h-5 w-5"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                            </svg>
                          )}
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-center">
                    <div className="max-w-md px-4">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Select a conversation</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Choose a conversation from the list to view messages.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
