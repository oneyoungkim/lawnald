import asyncio
import websockets
import sys

async def test_user_connection():
    lawyer_id = "welder49264@naver.com"
    client_id = "test_client"
    uri = f"ws://localhost:8002/ws/chat/{lawyer_id}/{client_id}/user"
    print(f"User connecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            print("User Connected!")
            
            # Send message
            await websocket.send("Hello from User")
            print("User sent message")

            # Wait for reply
            print("User waiting for reply...")
            msg = await websocket.recv() # This might be the echo of own message first depending on implementation
            print(f"User received: {msg}")
            
            msg2 = await websocket.recv() # Expecting lawyer reply
            print(f"User received 2: {msg2}")

    except Exception as e:
        print(f"User Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_user_connection())
