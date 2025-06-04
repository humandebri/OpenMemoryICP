// OpenMemory API Client for saving conversation
const API_KEY = 'om_feoQrSrz5UqCQ3DjfaXkyMv7x4mtt08O';
const BASE_URL = 'https://77fv5-oiaaa-aaaal-qsoea-cai.raw.icp0.io';

// Development API key (fallback)
const DEV_API_KEY = 'openmemory-api-key-development';

async function saveConversation() {
  const conversationData = {
    title: "OpenMemory ICP Development - Complete Implementation Session",
    content: `User: フロントエンドでAPIの設定をできる様にしてもらえませんか？　また、APIの使い方をreadmeにまとめて