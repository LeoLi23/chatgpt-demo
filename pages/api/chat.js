import { OpenAIStream } from "../../utils/chatgpt";

export const config = {
  runtime: "edge"
};

const handler = async (req) => {
  const {prompt} = await req.json();
  console.log("Prompt: ", prompt);
  
  const payload = {
      model: "gpt-4-1106-preview",
      messages: [
        { "role": "system", "content": "You are a helpful assistant." },
        { "role": "user", "content": prompt }
      ],
      stream: true, // enabling streaming
  };

  const stream = await OpenAIStream(payload);
  return new Response(stream);
};

export default handler;
