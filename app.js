import { Wllama } from "./wllama/wllama.js";

const status = document.getElementById("status");
const statusTitle = document.getElementById("statusTitle");
const progress = document.getElementById("progress");

const chat = document.getElementById("chat");
const input = document.getElementById("input");
const send = document.getElementById("send");

let llama = null;


// ======================================================
// ステータス表示
// ======================================================

function setStatus(title, message, percent = null) {

  statusTitle.textContent = title;
  status.textContent = message;

  if (percent !== null) {
    progress.style.width = `${percent}%`;
  }
}


// ======================================================
// メッセージ表示
// ======================================================

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


// ======================================================
// ブラウザ環境確認
// ======================================================

function checkEnvironment() {

  const lines = [];

  lines.push(`Browser: ${navigator.userAgent}`);
  lines.push(`Platform: ${navigator.platform}`);

  lines.push(
    `WebGPU: ${
      "gpu" in navigator
        ? "利用可能"
        : "利用不可"
    }`
  );

  lines.push(
    `WebAssembly: ${
      typeof WebAssembly !== "undefined"
        ? "利用可能"
        : "利用不可"
    }`
  );

  return lines.join("\n");
}


// ======================================================
// モデル読み込み
// ======================================================

async function initialize() {

  try {

    setStatus(
      "① 環境確認",
      checkEnvironment(),
      5
    );

    await new Promise(resolve =>
      setTimeout(resolve, 300)
    );


    // --------------------------------------------------
    // wllama初期化
    // --------------------------------------------------

    setStatus(
      "② wllama初期化",
      "Wllamaを初期化しています...",
      10
    );

    llama = new Wllama({
      logger: {
        debug: (...args) =>
          console.debug("[wllama]", ...args),

        info: (...args) =>
          console.info("[wllama]", ...args),

        warn: (...args) =>
          console.warn("[wllama]", ...args),

        error: (...args) =>
          console.error("[wllama]", ...args)
      }
    });


    // --------------------------------------------------
    // モデル
    // --------------------------------------------------

    const MODEL_URL =
      "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q2_k.gguf";


    setStatus(
      "③ モデル読み込み",
      "Qwen2.5-0.5B GGUFを読み込んでいます...\n\n" +
      "モデル：約415MB\n" +
      "通信環境によって時間がかかります。",
      15
    );


    await llama.loadModelFromUrl(MODEL_URL, {

      n_ctx: 2048,

      n_threads: 4,

      // ダウンロード進捗
      onProgress: (progressValue) => {

        const percent =
          Math.round(
            15 + progressValue * 80
          );

        setStatus(
          "③ モデル読み込み",
          `Qwen2.5-0.5B GGUFをダウンロード中...\n\n` +
          `${Math.round(progressValue * 100)}%`,
          percent
        );

      }

    });


    // --------------------------------------------------
    // 完了
    // --------------------------------------------------

    setStatus(
      "✓ 起動完了",
      "Qwen2.5-0.5Bをブラウザ上で読み込みました。\n\n" +
      "メッセージを入力してください。",
      100
    );

    input.disabled = false;
    send.disabled = false;

    input.focus();


  } catch (error) {

    console.error(error);

    setStatus(
      "✕ エラー",
      `${error.name || "Error"}\n\n` +
      `${error.message || error}`,
      0
    );

    input.disabled = true;
    send.disabled = true;

  }

}


// ======================================================
// メッセージ送信
// ======================================================

async function sendMessage() {

  const text = input.value.trim();

  if (!text || !llama) {
    return;
  }

  input.value = "";

  addMessage("user", text);

  const answer = addMessage(
    "assistant",
    "生成しています..."
  );

  send.disabled = true;
  input.disabled = true;


  setStatus(
    "🤖 推論中",
    "Qwen2.5が回答を生成しています...",
    100
  );


  try {

    const prompt =
      `<|im_start|>system\n` +
      `You are a helpful assistant.` +
      `<|im_end|>\n` +

      `<|im_start|>user\n` +
      `${text}` +
      `<|im_end|>\n` +

      `<|im_start|>assistant\n`;


    let output = "";


    await llama.createCompletion(prompt, {

      n_predict: 256,

      temperature: 0.7,

      top_p: 0.9,


      onNewToken: (token) => {

        output += token;

        answer.textContent =
          `Qwen: ${output}`;

        chat.scrollTop =
          chat.scrollHeight;

      }

    });


    setStatus(
      "✓ 生成完了",
      "回答を生成しました。\n\n" +
      "次のメッセージを入力できます。",
      100
    );


  } catch (error) {

    console.error(error);

    answer.textContent =
      `エラー: ${error.message}`;


    setStatus(
      "✕ 推論エラー",
      `${error.name || "Error"}\n\n` +
      `${error.message || error}`,
      0
    );

  } finally {

    send.disabled = false;
    input.disabled = false;

    input.focus();

  }

}


// ======================================================
// Enterで送信
// ======================================================

send.addEventListener(
  "click",
  sendMessage
);


input.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      sendMessage();

    }

  }
);


// ======================================================
// 起動
// ======================================================

initialize();
