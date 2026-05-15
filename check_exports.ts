import * as genai from "@google/genai";
const client = new genai.GoogleGenAI({ apiKey: "test" });
console.log("Has models:", !!client.models);
if (client.models) {
  console.log("Models keys:", Object.keys(client.models));
  console.log("Models methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(client.models)));
}
