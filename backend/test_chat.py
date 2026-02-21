import asyncio
import websockets
import json
import requests
import uuid

BASE_URL = "http://localhost:8001"
WS_URL = "ws://localhost:8001"

async def test_chat_flow():
    lawyer_id = "lawyer1@example.com"
    client_id = str(uuid.uuid4())
    
    print(f"Testing Chat Flow with Client ID: {client_id}")

    # 1. Connect Lawyer
    lawyer_uri = f"{WS_URL}/ws/chat/{lawyer_id}/{client_id}/lawyer"
    async with websockets.connect(lawyer_uri) as lawyer_ws:
        print("Lawyer connected.")
        
        # 2. Connect Client
        client_uri = f"{WS_URL}/ws/chat/{lawyer_id}/{client_id}/user"
        async with websockets.connect(client_uri) as client_ws:
            print("Client connected.")

            # 3. Client sends message
            msg_content = "Hello Lawyer!"
            await client_ws.send(msg_content)
            print(f"Client sent: {msg_content}")

            # 4. Lawyer receives message
            lawyer_msg = await lawyer_ws.recv()
            lawyer_data = json.loads(lawyer_msg)
            print(f"Lawyer received: {lawyer_data}")
            assert lawyer_data["content"] == msg_content
            assert lawyer_data["sender"] == "user"

            # 5. Lawyer replies
            reply_content = "Hello Client, how can I help?"
            await lawyer_ws.send(reply_content)
            print(f"Lawyer sent: {reply_content}")

            # 6. Client receives reply
            client_msg = await client_ws.recv()
            client_data = json.loads(client_msg)
            print(f"Client received: {client_data}")
            assert client_data["content"] == reply_content
            assert client_data["sender"] == "lawyer"

    # 7. Check History via API
    response = requests.get(f"{BASE_URL}/api/chats/{lawyer_id}/{client_id}/messages")
    history = response.json()
    print(f"Chat History: {len(history)} messages")
    assert len(history) >= 2
    assert history[-2]["content"] == msg_content
    assert history[-1]["content"] == reply_content
    
    print("\n✅ Chat Verification Passed!")

if __name__ == "__main__":
    try:
        asyncio.run(test_chat_flow())
    except Exception as e:
        print(f"\n❌ Chat Verification Failed: {e}")
