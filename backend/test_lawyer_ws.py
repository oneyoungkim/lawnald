import asyncio
import websockets
import sys

async def test_lawyer_connection():
    lawyer_id = "welder49264@naver.com"
    client_id = "test_client"
    uri = f"ws://localhost:8002/ws/chat/{lawyer_id}/{client_id}/lawyer"
    print(f"Lawyer connecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            print("Lawyer Connected!")
            
            # Wait for message from user
            print("Lawyer waiting for message...")
            msg = await websocket.recv()
            print(f"Lawyer verified received: {msg}")

            # Send reply
            await websocket.send("Hello from Lawyer")
            print("Lawyer sent reply")
            
            # Keep open briefly
            await asyncio.sleep(2)
    except Exception as e:
        print(f"Lawyer Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_lawyer_connection())
