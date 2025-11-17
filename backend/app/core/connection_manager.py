from typing import Dict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket) -> int:
        await websocket.accept()
        client_id = id(websocket)
        self._connections[client_id] = websocket
        return client_id

    def disconnect(self, client_id: int) -> None:
        self._connections.pop(client_id, None)


connection_manager = ConnectionManager()

