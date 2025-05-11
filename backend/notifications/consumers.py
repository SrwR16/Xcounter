import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer


class NotificationConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time notifications."""

    async def connect(self):
        """Handle WebSocket connection."""
        if self.scope["user"].is_anonymous:
            # Reject anonymous users
            await self.close()
            return

        self.user_id = str(self.scope["user"].id)
        self.notification_group_name = f"notifications_{self.user_id}"

        # Join notification group
        await self.channel_layer.group_add(
            self.notification_group_name, self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        # Leave notification group
        await self.channel_layer.group_discard(
            self.notification_group_name, self.channel_name
        )

    async def receive(self, text_data):
        """Handle receiving messages from WebSocket."""
        data = json.loads(text_data)
        message_type = data.get("type")

        if message_type == "mark_read":
            notification_id = data.get("notification_id")
            if notification_id:
                success = await self.mark_notification_read(notification_id)
                await self.send(
                    text_data=json.dumps(
                        {
                            "type": "mark_read_response",
                            "notification_id": notification_id,
                            "success": success,
                        }
                    )
                )

    async def notification(self, event):
        """Handle notification event and send to WebSocket."""
        # Send notification to WebSocket
        await self.send(text_data=json.dumps(event["data"]))

    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """Mark a notification as read."""
        from .models import Notification

        try:
            notification = Notification.objects.get(
                id=notification_id, user_id=self.scope["user"].id
            )
            if not notification.is_read:
                notification.is_read = True
                notification.save(update_fields=["is_read"])
            return True
        except Notification.DoesNotExist:
            return False
