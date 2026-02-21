import asyncio
import websockets
import json

async def test_monitor():
    lawyer_id = "test_lawyer_monitor"
    monitor_uri = f"ws://127.0.0.1:8003/ws/monitor/{lawyer_id}"
    
    print(f"Connecting Monitor to {monitor_uri}...")
    async with websockets.connect(monitor_uri) as monitor_ws:
        print("Monitor Connected!")
        
        # Now simulate a user sending a message
        client_id = "test_client_for_monitor"
        user_uri = f"ws://127.0.0.1:8003/ws/chat/{lawyer_id}/{client_id}/user"
        
        print(f"Connecting User to {user_uri}...")
        async with websockets.connect(user_uri) as user_ws:
            print("User Connected!")
            
            msg = "Hello Lawyer, do you see this?"
            print(f"User sending: {msg}")
            await user_ws.send(msg)
            
            # Monitor should receive it
            print("Monitor waiting for event...")
            event = await monitor_ws.recv()
            print(f"Monitor Received: {event}")
            
            data = json.loads(event)
            assert data['type'] == 'new_message'
            assert data['message']['content'] == msg
            print("TEST PASSED: Monitor received the message correctly.")

if __name__ == "__main__":
    asyncio.run(test_monitor())
