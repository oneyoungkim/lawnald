import asyncio
import websockets
import sys

async def test_connection():
    # Use localhost:8001 as per new setup
    uri = "ws://localhost:8002/ws/chat/welder49264@naver.com/test_client/user"
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to Chat Server 8001!")
            await websocket.send("Hello")
            print("Sent message")
            # Wait for echo/ack if any, or just wait a bit
            # The chat app broadcasts the message back
            response = await websocket.recv()
            print(f"Received: {response}")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
