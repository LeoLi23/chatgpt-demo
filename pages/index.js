import {useState } from 'react';
import styles from '../styles/chat.module.css'; // Ensure to update the CSS file name if different
import Image from 'next/image';
import userAvatar from '../public/user-avatar.jpeg';
import botAvatar from '../public/gpt-avatar.png';

const maxRetries = 3;

export default function Home() {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState([]);

  const sendMessage = async (text) => {
    if (text.trim() === '') return;
    const userMessage = { role: 'user', content: text };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setUserInput('');

    await fetchGeneratedText();
  };

  const fetchWithRetry = async (url, options, retryCount = maxRetries)  => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response;
    } catch (error) {
      console.log("Error calling API: ", error);
      if (retryCount > 0) {
        console.log(`Retrying fetch (${retryCount} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchWithRetry(url, options, retryCount - 1);
      } else {
        throw new Error("Max retries exceeded");
      }
    }
  };

  const fetchGeneratedText = async () => {
    // Initialize an empty string to hold the incoming chunks
    let curr = '';

    try {
      const response = await fetchWithRetry('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userInput }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
    
      // Set an initial bot message object with an empty content
      const botMessageIndex = messages.length;
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'bot', content: '' },
      ]);

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunkValue = decoder.decode(value, {stream: true});
          curr += chunkValue; // Append each chunk to the partial message

          // Update the last message object with the partial content
          setMessages((prevMessages) => {
            const newMessages = [...prevMessages];
            newMessages[botMessageIndex + 1] = { role: 'bot', content: curr };
            return newMessages;
          });
        }
      }
    } catch (error) {
      console.error("Error fetching generated text: ", error);
      return '';
    }
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messagesContainer}>
        {messages.map((msg, index) => (
          <div key={index} className={msg.role === 'user' ? styles.userMessage : styles.botMessage}>
            <Image
              src={msg.role === 'user' ? userAvatar : botAvatar}
              alt={msg.role === 'user' ? 'User' : 'ChatGPT'}
              width={40} // Set desired size
              height={40} // Set desired size
              className={styles.avatar} // This will be a class in your CSS
            />
          <span>{msg.content}</span>
        </div>
        ))}
      </div>

      <div className={styles.inputContainer}>
        <input
          type="text"
          className={styles.messageInput}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage(userInput)}
          placeholder="Message ChatGPT..."
        />
        <button
          className={styles.sendButton}
          onClick={() => sendMessage(userInput)}
        >
          Send
        </button>
      </div>
    </div>
  );
}
