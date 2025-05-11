/**
 * Real-time notifications using WebSockets
 *
 * This script connects to the WebSocket server to receive real-time notifications
 * and displays them to the user.
 */

// Notification display config
const NOTIFICATION_DISPLAY_TIME = 5000; // 5 seconds
const NOTIFICATION_CONTAINER_ID = "notification-container";

// Create notification container if it doesn't exist
function ensureNotificationContainer() {
  let container = document.getElementById(NOTIFICATION_CONTAINER_ID);
  if (!container) {
    container = document.createElement("div");
    container.id = NOTIFICATION_CONTAINER_ID;
    container.style.position = "fixed";
    container.style.bottom = "20px";
    container.style.right = "20px";
    container.style.zIndex = "9999";
    document.body.appendChild(container);
  }
  return container;
}

// WebSocket connection
let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 seconds

// Initialize WebSocket connection
function initWebSocket() {
  // Get the protocol (ws or wss)
  const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
  const host = window.location.host;
  const wsUrl = `${protocol}${host}/ws/notifications/`;

  // Close existing socket if any
  if (socket) {
    socket.close();
  }

  // Create new WebSocket connection
  socket = new WebSocket(wsUrl);

  // Connection opened
  socket.addEventListener("open", (event) => {
    console.log("WebSocket connection established");
    reconnectAttempts = 0; // Reset reconnect attempts

    // Add a small delay before considering the connection stable
    setTimeout(() => {
      // Send a ping to verify connection
      sendPing();
    }, 1000);
  });

  // Connection closed
  socket.addEventListener("close", (event) => {
    console.log("WebSocket connection closed");
    attemptReconnect();
  });

  // Connection error
  socket.addEventListener("error", (event) => {
    console.error("WebSocket error:", event);
    socket.close();
  });

  // Listen for messages
  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    handleWebSocketMessage(data);
  });
}

// Attempt to reconnect to WebSocket server
function attemptReconnect() {
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

    setTimeout(() => {
      initWebSocket();
    }, RECONNECT_DELAY);
  } else {
    console.error("Max reconnect attempts reached. Please refresh the page.");
  }
}

// Send a ping to keep the connection alive
function sendPing() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "ping" }));

    // Schedule next ping
    setTimeout(sendPing, 30000); // 30 seconds
  }
}

// Mark a notification as read
function markNotificationAsRead(notificationId) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: "mark_read",
        notification_id: notificationId,
      })
    );
  }
}

// Handle incoming WebSocket messages
function handleWebSocketMessage(data) {
  if (!data.type) return;

  switch (data.type) {
    case "notification":
      displayNotification(data);
      break;
    case "mark_read_response":
      console.log(`Notification ${data.notification_id} marked as read: ${data.success}`);
      break;
    case "pong":
      console.log("Received pong from server");
      break;
    default:
      console.log("Unknown message type:", data.type);
      break;
  }
}

// Display a notification to the user
function displayNotification(data) {
  const container = ensureNotificationContainer();

  // Create notification element
  const notification = document.createElement("div");
  notification.classList.add("notification");
  notification.dataset.id = data.id;
  notification.dataset.type = data.notification_type;

  // Style the notification
  notification.style.backgroundColor = "#fff";
  notification.style.borderLeft = "4px solid #2c3e50";
  notification.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
  notification.style.padding = "12px 15px";
  notification.style.marginBottom = "10px";
  notification.style.borderRadius = "4px";
  notification.style.position = "relative";
  notification.style.maxWidth = "300px";
  notification.style.wordWrap = "break-word";
  notification.style.transition = "all 0.3s ease";

  // Customize border color based on notification type
  switch (data.notification_type) {
    case "BOOKING_CONFIRMATION":
      notification.style.borderLeftColor = "#27ae60"; // Green
      break;
    case "BOOKING_CANCELLATION":
      notification.style.borderLeftColor = "#c0392b"; // Red
      break;
    case "SHOW_REMINDER":
      notification.style.borderLeftColor = "#f39c12"; // Orange
      break;
    case "SYSTEM_ANNOUNCEMENT":
      notification.style.borderLeftColor = "#3498db"; // Blue
      break;
    default:
      notification.style.borderLeftColor = "#2c3e50"; // Dark blue
      break;
  }

  // Create notification content
  notification.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <h4 style="margin-top: 0; margin-bottom: 5px; font-size: 14px;">${data.notification_type_name}</h4>
            <button class="close-notification" style="background: none; border: none; cursor: pointer; font-size: 16px; color: #7f8c8d;">&times;</button>
        </div>
        <div style="font-size: 14px; margin-bottom: 5px; font-weight: bold;">${data.subject}</div>
        <div style="font-size: 12px;">${data.content}</div>
    `;

  // Add close button event
  const closeButton = notification.querySelector(".close-notification");
  closeButton.addEventListener("click", () => {
    markNotificationAsRead(data.id);
    notification.style.opacity = "0";
    notification.style.transform = "translateX(30px)";

    setTimeout(() => {
      notification.remove();
    }, 300);
  });

  // Add to container
  container.appendChild(notification);

  // Auto-dismiss after timeout
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateX(30px)";

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, NOTIFICATION_DISPLAY_TIME);
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  ensureNotificationContainer();

  // Only initialize WebSocket for logged-in users
  if (document.body.classList.contains("logged-in")) {
    initWebSocket();
  }
});

// Expose API for other scripts
window.XCounterNotifications = {
  markAsRead: markNotificationAsRead,
  init: initWebSocket,
  displayNotification: displayNotification,
};
