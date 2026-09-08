import { Wllama } from "./wllama/wllama.js";

const status = document.getElementById("status");
const chat = document.getElementById("chat");
const input = document.getElementById("input");
const send = document.getElementById("send");

let llama = null;

const MODEL_URL =
  "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q2_k.gguf";


function setStatus(text) {
  status.textContent = text;
}


function addMessage(role, text) {
  const div = document.createElement("div");

  div.className = role;

  div.textContent =
    role === "user"
      ? `あなた: ${text}`
      : `Qwen: ${text}`;

  chat.appendChild(div);

  chat.scrollTop = chat.scrollHeight;

  return div;
}


async function initialize() {

  try {

    setStatus("wllamaを初期化しています...");

    llama = new Wllama({
      logger: {
        debug: console.debug,
        info: console.info,
        warn: console.warn,
        error: console.error
      }
    });

    setStatus("Qwen2.5-0.5B GGUFを読み込んでいます...\n約415MBあります。");

    await llama.loadModelFromUrl(MODEL_URL, {
      n_ctx: 2048,
      n_threads: 4
    });

    setStatus(
      "モデル読み込み完了！\n" +
      "Qwen2.5-0.5Bがブラウザ上で動作しています。"
    );

    input.disabled = false;
    send.disabled = false;

    input.focus();

  } catch (error) {

    console.error(error);

    setStatus(
      "エラーが発生しました。\n\n" +
      error.message
    );

  }
}


async function sendMessage() {

  const text = input.value.trim();

  if (!text || !llama) {
    return;
  }

  input.value = "";

  addMessage("user", text);

  const answer = addMessage("assistant", "考え中...");

  send.disabled = true;
  input.disabled = true;

  try {

    const prompt =
      `<|im_start|>system\n` +
      `You are a helpful assistant.<|im_end|>\n` +
      `<|im_start|>user\n` +
      `${text}<|im_end|>\n` +
      `<|im_start|>assistant\n`;

    let output = "";

    await llama.createCompletion(prompt, {
      n_predict: 256,
      temperature: 0.7,
      top_p: 0.9,

      onNewToken: (token) => {
        output += token;
        answer.textContent = `Qwen: ${output}`;
        chat.scrollTop = chat.scrollHeight;
      }
    });

  } catch (error) {

    console.error(error);

    answer.textContent =
      `エラー: ${error.message}`;

  } finally {

    send.disabled = false;
    input.disabled = false;
    input.focus();

  }
}


send.addEventListener("click", sendMessage);

input.addEventListener("keydown", (event) => {

  if (
    event.key === "Enter" &&
    !event.shiftKey
  ) {

    event.preventDefault();

    sendMessage();

  }

});


initialize();
