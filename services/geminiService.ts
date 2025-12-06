// FIX: Replaced 'BlockThreshold' with 'HarmBlockThreshold' as it is the correct exported member from @google/genai.
import { GoogleGenAI, Type, Modality, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import type { QuizQuestion, NumericalProblem, QuizResult, Flashcard, SiUnit, TopicSiUnits } from "../types";
import { getFromCache, saveToCache } from '../utils/caching';
import { makeApiCall } from "../utils/apiUtils";
import { physicsChapters } from '../data/physicsTopics';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Centralized safety settings to mitigate potential 500 errors from overactive filters.
const defaultSafetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        // FIX: Replaced 'BlockThreshold' with 'HarmBlockThreshold'.
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        // FIX: Replaced 'BlockThreshold' with 'HarmBlockThreshold'.
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        // FIX: Replaced 'BlockThreshold' with 'HarmBlockThreshold'.
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        // FIX: Replaced 'BlockThreshold' with 'HarmBlockThreshold'.
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
];

const systemInstruction = `You are an expert AI Physics Tutor specializing in the NCERT syllabus for both first and second year PUC (Pre-University Course) students. Your goal is to provide clear, step-by-step explanations and detailed answers to Physics questions. Use simple and easy-to-understand language. Format your responses using Markdown. 
Use **bold text** for keywords and for all formulas. 
**Critically, do not use LaTeX or any complex mathematical syntax like '$...$' or '\\frac'.** Instead, represent all formulas using simple, keyboard-friendly characters and standard Unicode symbols for Greek letters and mathematical operators (e.g., Δ, ε, π, θ, √, →). For subscripts, use Unicode characters (e.g., v₀, I₁). If a Unicode subscript is not available, write it out as a word (e.g., "K initial", "V final"). **Under no circumstances use underscores (_).** For example, correctly formatted formulas are: **F = m * a**, **Δx = v₀t + (1/2)at²**, **K final = K initial + W**.
Critically, wrap all practical examples or real-life numericals inside special tags: [EXAMPLE] and [/EXAMPLE]. When creating content for these [EXAMPLE] tags, use very simple, everyday English so that students can easily understand the real-world connection.`;

export async function getTutorResponse(question: string, chapter: string): Promise<string> {
  const fullPrompt = `Regarding the chapter "${chapter}" from the PUC NCERT Physics textbook, please answer the following question: ${question}`;
  try {
    const response = await makeApiCall<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        systemInstruction: systemInstruction,
        safetySettings: defaultSafetySettings,
        thinkingConfig: { thinkingBudget: 0 }
      },
    }));

    return response.text;
  } catch (error) {
    console.error("Error fetching response from Gemini API:", error);
    return "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again later.";
  }
}

export async function getTopicExplanation(chapter: string, topic: string): Promise<string> {
  const fullPrompt = `Regarding the chapter "${chapter}" from the PUC NCERT Physics textbook, please provide a clear and detailed explanation of the following topic: "${topic}".`;
  try {
    const response = await makeApiCall<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        systemInstruction: systemInstruction,
        safetySettings: defaultSafetySettings,
        thinkingConfig: { thinkingBudget: 0 }
      },
    }));

    return response.text;
  } catch (error) {
    console.error("Error fetching explanation from Gemini API:", error);
    return "I'm sorry, I encountered an issue while preparing the explanation for this topic. Please try again.";
  }
}

export async function* getTopicExplanationStream(chapter: string, topic: string): AsyncGenerator<string> {
  const cacheKey = `explanation-${chapter}-${topic}`;
  const cachedData = getFromCache<string>(cacheKey);
  if (cachedData) {
    yield cachedData;
    return;
  }

  // Simplified prompt to encourage faster start
  const fullPrompt = `Explain the topic "${topic}" from the chapter "${chapter}" (PUC NCERT Physics). Start directly with the core concept.`;
  
  let lastError: any;
  const maxRetries = 3;
  const initialDelayMs = 500; // Reduced delay for faster retries

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
          systemInstruction: systemInstruction,
          safetySettings: defaultSafetySettings,
          thinkingConfig: { thinkingBudget: 0 }
        },
      });
      
      let fullText = '';
      for await (const chunk of response) {
        const chunkText = chunk.text;
        fullText += chunkText;
        yield chunkText;
      }
      saveToCache(cacheKey, fullText);
      return; // Success, exit the loop and function

    } catch (error: any) {
      lastError = error;
      const errorString = error.toString();
      // Retry on rate limiting (429) and common server-side errors (5xx).
      if (errorString.includes('429') || errorString.includes('500') || errorString.includes('503') || errorString.includes('504')) {
          const delayTime = initialDelayMs * Math.pow(2, i) + Math.random() * 500; // Add jitter
          console.warn(`Retriable stream error encountered. Retrying in ${Math.round(delayTime / 1000)}s... (Attempt ${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delayTime));
      } else {
          // For other errors, fail immediately.
          console.error("Error fetching explanation stream from Gemini API:", error);
          yield "I'm sorry, I encountered an issue while preparing the explanation for this topic. Please try again.";
          return;
      }
    }
  }
  
  // If all retries fail, throw the last captured error.
  console.error("Stream API call failed after multiple retries.", lastError);
  yield "I'm sorry, I'm having trouble connecting to my knowledge base right now after multiple attempts. Please try again later.";
}

export async function getToolbarResponse(chapter: string, topic: string, action: string): Promise<string> {
    let fullPrompt = `Regarding the topic "${topic}" in the chapter "${chapter}", please ${action}.`;
    // Add specific formatting instructions for certain actions to ensure consistency.
    if (action.toLowerCase().includes('si unit')) {
        fullPrompt += " Format the response as a clean Markdown table with three columns: 'Quantity', 'SI Unit', and 'Symbol'. Ensure the table is correctly formatted with pipes and headers.";
    }
    try {
        const response = await makeApiCall<GenerateContentResponse>(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                systemInstruction: systemInstruction,
                safetySettings: defaultSafetySettings,
                thinkingConfig: { thinkingBudget: 0 }
            },
        }));
        return response.text;
    } catch (error) {
        console.error("Error fetching toolbar response from Gemini API:", error);
        return "I'm sorry, I encountered an issue while processing your request. Please try again.";
    }
}

export async function getQuizQuestions(chapter: string, topic: string): Promise<QuizQuestion[]> {
  const cacheKey = `quiz-v2-${chapter}-${topic}`; // Updated cache key version
  const cachedData = getFromCache<QuizQuestion[]>(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  // Reduced from 10 to 5 questions for speed
  const prompt = `Generate exactly 5 competitive, NCERT-based Multiple Choice Questions (MCQs) for the topic "${topic}" from the chapter "${chapter}". The questions should be very important from an examination point of view.
Each question must have exactly 4 options.
You must indicate the correct answer for each question.
For each question, provide a concise explanation for why the correct answer is correct.
Provide the output in a structured JSON format according to the provided schema. Ensure the options array always contains 4 string elements. The correctAnswer must be one of the strings from the options array.`;

  try {
    const response = await makeApiCall<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              description: "An array of 5 multiple-choice questions.",
              items: {
                type: Type.OBJECT,
                properties: {
                  question: {
                    type: Type.STRING,
                    description: "The text of the multiple-choice question."
                  },
                  options: {
                    type: Type.ARRAY,
                    description: "An array of exactly 4 possible answers.",
                    items: { type: Type.STRING }
                  },
                  correctAnswer: {
                    type: Type.STRING,
                    description: "The correct answer, which must match one of the provided options."
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "A brief explanation of why the correct answer is correct."
                  }
                },
                required: ["question", "options", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["questions"]
        },
        safetySettings: defaultSafetySettings,
        thinkingConfig: { thinkingBudget: 0 }
      },
    }));

    const jsonResponse = JSON.parse(response.text);
    const questions = jsonResponse.questions || jsonResponse;
    if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("Invalid question format received from API.");
    }
    saveToCache(cacheKey, questions);
    return questions;
  } catch (error) {
    console.error("Error fetching quiz questions from Gemini API:", error);
    return [];
  }
}

const numericalSolutionInstruction = `You are an expert AI Physics Tutor specializing in solving numerical problems from the NCERT syllabus for PUC students. Your primary goal is to provide exceptionally clear, accurate, and easy-to-follow step-by-step solutions.

Your response MUST be structured in the following sequence using Markdown for formatting:

1.  **Given:**
    *   List all the data points provided in the problem.
    *   Use standard symbols (e.g., v for velocity, t for time).
    *   Include the units for each value (e.g., 10 m/s).

2.  **To Find:**
    *   Clearly state what quantity needs to be calculated.

3.  **Formula:**
    *   State the relevant formula or formulas that will be used to solve the problem.
    *   All formulas MUST be enclosed in **bold asterisks**. For example: **F = m * a**.
    *   **Critically, do not use LaTeX or any complex mathematical syntax like '$...$' or '\\frac'.** Instead, represent all formulas using simple, keyboard-friendly characters.
    *   For subscripts, use Unicode characters (e.g., v₀, I₁). If a Unicode subscript is not available, write it out as a word (e.g., "K initial", "V final"). **Under no circumstances use underscores (_).** For example, use **v = u + a*t**.

4.  **Solution:**
    *   Provide a detailed, step-by-step calculation.
    *   Show the substitution of the given values into the formula.
    *   Explain each major step of the calculation concisely.

5.  **Answer:**
    *   State the final answer clearly and prominently.
    *   The final answer must include the correct units.

6.  **Real-World Connection:**
    *   Provide a brief, relatable example of how this physics principle applies in a real-world scenario. Use very simple English, as if explaining to a friend, to help the student connect the concept to everyday life and make it easy to grasp.

Adhere strictly to this format. The clarity and structure of your answer are paramount.`;

async function getNumericalExamples(chapter: string, topic: string, prompt: string, cacheKey: string): Promise<NumericalProblem[]> {
    const cachedData = getFromCache<NumericalProblem[]>(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    try {
        const response = await makeApiCall<GenerateContentResponse>(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        problems: {
                            type: Type.ARRAY,
                            description: "An array of numerical problems with solutions.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    problem: {
                                        type: Type.STRING,
                                        description: "The statement of the numerical problem."
                                    },
                                    solution: {
                                        type: Type.STRING,
                                        description: "The detailed, step-by-step solution in Markdown."
                                    }
                                },
                                required: ["problem", "solution"]
                            }
                        }
                    },
                    required: ["problems"]
                },
                systemInstruction: numericalSolutionInstruction,
                safetySettings: defaultSafetySettings,
                thinkingConfig: { thinkingBudget: 0 }
            },
        }));

        const jsonResponse = JSON.parse(response.text);
        const problems = jsonResponse.problems;
        if (!Array.isArray(problems)) {
            throw new Error("Invalid format for numerical problems received from API.");
        }
        saveToCache(cacheKey, problems);
        return problems;
    } catch (error) {
        console.error("Error fetching numerical examples from Gemini API:", error);
        return [];
    }
}


export async function getNcertTextbookQuestions(chapter: string, topic: string): Promise<NumericalProblem[]> {
    // Reduced to 2 problems to improve generation speed (latency).
    const prompt = `Generate exactly 2 important solved numerical problems for a Karnataka State Board PUC student. The questions must be strictly based on the official NCERT textbook syllabus as prescribed for the Karnataka State Board for the topic "${topic}" from the chapter "${chapter}". These should be typical 'textbook-style' questions. Each problem must come with a detailed, step-by-step solution following the prescribed format.`;
    const cacheKey = `ncert-questions-v2-${chapter}-${topic}`;
    return getNumericalExamples(chapter, topic, prompt, cacheKey);
}

export async function getCompetitiveNumericals(chapter: string, topic: string): Promise<NumericalProblem[]> {
     // Reduced to 2 problems to improve generation speed (latency).
    const prompt = `Generate exactly 2 challenging, competitive exam level (like JEE/NEET) numerical problems for the topic "${topic}" from the chapter "${chapter}". The problems should test deep conceptual understanding. Each problem must come with a detailed, step-by-step solution following the prescribed format.`;
    const cacheKey = `competitive-numericals-v2-${chapter}-${topic}`;
    return getNumericalExamples(chapter, topic, prompt, cacheKey);
}

export async function getStudyTips(quizHistory: QuizResult[]): Promise<string> {
  if (quizHistory.length === 0) {
    return "You haven't completed any quizzes yet. Take a few quizzes, and then I can give you personalized study tips!";
  }

  const simplifiedHistory = quizHistory.slice(-10).map(q => ({
    topic: q.topic,
    score: `${q.score}/${q.total}`,
    percentage: Math.round((q.score / q.total) * 100),
  }));

  const prompt = `I am a PUC Physics student. Here is my recent quiz history:
${JSON.stringify(simplifiedHistory, null, 2)}

Based on these results, please provide me with personalized, encouraging, and actionable study tips to help me improve.
- Identify my weakest topics based on the scores.
- Suggest specific learning strategies for those topics (e.g., "focus on conceptual understanding of Coulomb's Law before attempting more numericals").
- Provide some encouragement.
- Keep the advice concise and actionable.`;
  
  const studyCoachInstruction = `You are a friendly and encouraging AI study coach for Physics students specializing in the NCERT syllabus for PUC. Your goal is to provide helpful, personalized, and actionable advice based on a student's performance data. Format your response in Markdown, using headings, lists, and bold text to make it easy to read.`;

  try {
    const response = await makeApiCall<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: studyCoachInstruction,
        safetySettings: defaultSafetySettings,
        thinkingConfig: { thinkingBudget: 0 }
      },
    }));

    return response.text;
  } catch (error) {
    console.error("Error fetching study tips from Gemini API:", error);
    return "I'm sorry, I couldn't generate study tips right now. Please try again later.";
  }
}

const whiteboardTutorInstruction = `You are a Socratic AI physics tutor. Your role is to help a student solve a numerical problem by guiding them, not by giving them the answer directly. The student is working on a digital whiteboard. You will be given the full problem statement, the student's work so far, and their specific request.

Your primary goal is to foster understanding and critical thinking.

- If the student asks for a **hint**, provide a small, guiding question or suggest the very next logical step. For example, "What formula connects force, mass, and acceleration?" or "Have you converted all the units to the SI system?".
- If the student asks you to **check their work**, review their steps for errors in logic, calculation, or formula application. Gently point out the specific location of the mistake and explain the correct physical principle. For example, "You've correctly identified the formula, but take another look at the value you used for 'g'. Does it need to be positive or negative in this coordinate system?".
- If the student asks a **specific question**, answer it concisely and accurately.
- Always maintain an encouraging, patient, and supportive tone. Format your response in simple Markdown.`;


export async function* getWhiteboardAssistanceStream(
  problemStatement: string,
  whiteboardContent: string, 
  userQuery: string, 
  chapter: string, 
  topic: string
): AsyncGenerator<string> {
  const fullPrompt = `
I am a PUC student working on a Physics problem in the chapter "${chapter}" on the topic "${topic}".

**Problem Statement:**
${problemStatement}

**My work on the whiteboard so far:**
---
${whiteboardContent}
---

**My request:** "${userQuery}"

Please provide assistance based on my work and my request.
`;
  
  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        systemInstruction: whiteboardTutorInstruction,
        safetySettings: defaultSafetySettings,
        thinkingConfig: { thinkingBudget: 0 }
      },
    });

    for await (const chunk of response) {
        yield chunk.text;
    }

  } catch (error) {
    console.error("Error fetching whiteboard assistance from Gemini API:", error);
    yield "I'm sorry, I encountered an issue while helping you. Please try asking again.";
  }
}
// Deprecated blocking version
export async function getWhiteboardAssistance(
    problemStatement: string,
    whiteboardContent: string, 
    userQuery: string, 
    chapter: string, 
    topic: string
  ): Promise<string> {
    const fullPrompt = `...`; // Redundant, using stream now.
    return "";
}

export async function* getTestPaperStream(chapter: string, topic: string, examType: string, paperType: string): AsyncGenerator<string> {
  const cacheKey = `test-v2-${chapter}-${topic}-${examType}-${paperType}`;
  const cachedData = getFromCache<string>(cacheKey);
  if (cachedData) {
    yield cachedData;
    return;
  }

  const prompt = `Generate a ${paperType} for a ${examType} level examination on the topic "${topic}" from the chapter "${chapter}", as per the Karnataka State Board PUC syllabus. The paper should be concise and suitable for a 30-minute test. Include a mix of question types (e.g., MCQs, short answer, long answer). Total marks should be 15.`;
  
  const testPaperInstruction = `You are an expert AI question paper generator for PUC Physics students. Your output must be in clean, well-formatted Markdown. Structure the paper with clear sections, question numbers, and marks for each question. Adhere to the NCERT syllabus.

For all formulas, you **MUST** adhere to the following rules:
- **Critically, do not use LaTeX or any complex mathematical syntax like '$...$' or '\\frac'.**
- Instead, represent all formulas using simple, keyboard-friendly characters and standard Unicode symbols for Greek letters and mathematical operators (e.g., Δ, ε, π, θ, √, →).
- For subscripts, use Unicode characters (e.g., v₀, I₁). If a Unicode subscript is not available, write it out as a word (e.g., "K initial", "V final").
- **Under no circumstances use underscores (_).**
- All formulas must be enclosed in **bold asterisks**.
- For example, a correctly formatted formula is: **Δx = v₀t + (1/2)at²**.`;

  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: testPaperInstruction,
        safetySettings: defaultSafetySettings,
        thinkingConfig: { thinkingBudget: 0 }
      },
    });
    
    let fullText = '';
    for await (const chunk of response) {
        fullText += chunk.text;
        yield chunk.text;
    }
    saveToCache(cacheKey, fullText);

  } catch (error) {
    console.error("Error fetching test paper from Gemini API:", error);
    yield "Sorry, I was unable to generate the test paper at this moment. Please try again later.";
  }
}

// Deprecated blocking version
export async function getTestPaper(chapter: string, topic: string, examType: string, paperType: string): Promise<string> {
   // Kept for type safety if referenced elsewhere, but should use stream.
   return ""; 
}

export async function getFormulaSheet(chapter: string, topic: string): Promise<string> {
  const cacheKey = `formulas-v2-${chapter}-${topic}`;
  const cachedData = getFromCache<string>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const prompt = `Generate a concise yet comprehensive formula sheet for the topic "${topic}" from the chapter "${chapter}". The response should be well-structured and easy to read.

  For each formula:
  1. State the formula clearly using **bold Markdown**.
  2. Immediately after the formula, create a bulleted list explaining what each variable represents.

  Organize the formulas logically. Use Markdown headings to structure the sheet. Use '##' for main sections (e.g., "## Key Formulas") and '###' for sub-sections if needed. Avoid using single '#' for headings.`;

  const formulaInstruction = `You are an expert AI Physics Tutor creating a helpful, clean, and accurate formula sheet for a PUC student. All formulas MUST be from the official NCERT syllabus as prescribed for the Karnataka State Board. Your response should be formatted in clean Markdown. Your highest priority is symbol accuracy. You **MUST** use only the exact symbols (including capitalization and notation like bars over letters for averages) that are present in the official NCERT textbook. If a quantity does not have a symbol in the textbook, do not invent one.
  **Critically, do not use LaTeX or any complex mathematical syntax like '$...$' or '\\frac'.** Instead, represent all formulas using simple, keyboard-friendly characters and standard Unicode symbols for Greek letters and mathematical operators (e.g., Δ, ε, π, θ, √, →). For subscripts, use Unicode characters (e.g., v₀, I₁). If a Unicode subscript is not available, write it out as a word (e.g., "K initial", "V final"). **Under no circumstances use underscores (_).** For example, use **F = m * a** or **Δx = v₀t + (1/2)at²**. Do not include any conversational text, just the formula sheet itself.`;

  try {
    const response = await makeApiCall<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: formulaInstruction,
        safetySettings: defaultSafetySettings,
        thinkingConfig: { thinkingBudget: 0 }
      },
    }));

    const result = response.text;
    saveToCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error fetching formula sheet from Gemini API:", error);
    return "Could not load the formula sheet. Please try again later.";
  }
}

export async function getSiUnitsForChapter(chapterName: string): Promise<Map<string, SiUnit[]>> {
  const cacheKey = `si-units-chapter-v4-${chapterName}`;
  const cachedData = getFromCache<TopicSiUnits[]>(cacheKey);
  if (cachedData) {
    const map = new Map<string, SiUnit[]>();
    cachedData.forEach(item => map.set(item.topicName, item.units));
    return map;
  }

  const chapter = physicsChapters.find(c => c.name === chapterName);
  if (!chapter) {
    console.error(`Chapter not found: ${chapterName}`);
    return new Map();
  }
  const topics = chapter.topics.map(t => t.name);

  const prompt = `For the physics chapter "${chapterName}", create a comprehensive list of all key physical quantities, their standard SI units, and symbols. Organize the response as an array of topics, where each topic contains its relevant units. The topics to include are: ${topics.join(', ')}.`;
  
  const siUnitInstruction = `You are an AI assistant creating a structured list of physical quantities and their SI units for a PUC student. Your highest priority is accuracy according to the official Karnataka State Board NCERT textbook. For each quantity, provide its name, its full SI unit name followed by the unit's symbol in parentheses (e.g., 'Metre per second (m/s)'), and the official symbol for the physical quantity itself (e.g., 'v̅' for Average Velocity). **It is critical that you differentiate between quantities that have a standard, universally accepted symbol and those that do not. For quantities like 'Force' (F) or 'Velocity' (v), provide the symbol. For conceptual quantities or those without a standard symbol (like 'Path Length' or 'Significant Figures'), you MUST provide an empty string "" for the 'symbol' field.** Do not invent or guess symbols. If you are unsure, provide an empty string. Your output must be in the requested JSON format.`;

  try {
    const response = await makeApiCall<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topics: {
              type: Type.ARRAY,
              description: "An array of topics, each with its SI units.",
              items: {
                type: Type.OBJECT,
                properties: {
                  topicName: { type: Type.STRING, description: "The name of the topic." },
                  units: {
                    type: Type.ARRAY,
                    description: "SI units for this topic.",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        quantity: { type: Type.STRING, description: "The name of the physical quantity." },
                        unit: { type: Type.STRING, description: "The full name of the SI unit followed by its symbol in parentheses (e.g., 'Metre per second (m/s)')." },
                        symbol: { type: Type.STRING, description: "The symbol for the physical quantity (e.g., 'v̅' for Average Velocity)." }
                      },
                      required: ["quantity", "unit", "symbol"]
                    }
                  }
                },
                required: ["topicName", "units"]
              }
            }
          },
          required: ["topics"]
        },
        systemInstruction: siUnitInstruction,
        safetySettings: defaultSafetySettings,
        thinkingConfig: { thinkingBudget: 0 }
      }
    }));

    const jsonResponse = JSON.parse(response.text);
    const topicUnits: TopicSiUnits[] = jsonResponse.topics;

    if (!Array.isArray(topicUnits)) {
      throw new Error("Invalid format for chapter SI units received from API.");
    }
    
    saveToCache(cacheKey, topicUnits);
    
    const map = new Map<string, SiUnit[]>();
    topicUnits.forEach(item => map.set(item.topicName, item.units));
    return map;

  } catch (error) {
    console.error(`Error fetching SI units for chapter ${chapterName}:`, error);
    return new Map();
  }
}

export async function getFlashcards(chapter: string, topic: string): Promise<Flashcard[]> {
    const cacheKey = `flashcards-v2-${chapter}-${topic}`;
    const cachedData = getFromCache<Flashcard[]>(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    // Reduced from 15 to 8 (originally 10) for speed
    // FIX: Updated prompt to ensure definitions are extremely simple and student-friendly.
    const prompt = `Generate exactly 8 key terms and their concise definitions for the topic "${topic}" from the chapter "${chapter}". These should be perfect for flashcards.
    The definitions must be extremely simple, clear, and easy to understand for a student. Use simple language and avoid overly complex academic jargon.`;
    try {
        const response = await makeApiCall<GenerateContentResponse>(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        flashcards: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    term: { type: Type.STRING },
                                    definition: { type: Type.STRING }
                                },
                                required: ["term", "definition"]
                            }
                        }
                    },
                    required: ["flashcards"]
                },
                safetySettings: defaultSafetySettings,
                thinkingConfig: { thinkingBudget: 0 }
            },
        }));
        const jsonResponse = JSON.parse(response.text);
        const flashcards = jsonResponse.flashcards;
        if (!Array.isArray(flashcards)) {
            throw new Error("Invalid flashcard format from API.");
        }
        saveToCache(cacheKey, flashcards);
        return flashcards;
    } catch (error) {
        console.error("Error fetching flashcards from Gemini API:", error);
        return [];
    }
}

export async function getVisualizationPrompt(chapter: string, topic: string): Promise<string> {
    const cacheKey = `viz-v3-${chapter}-${topic}`; // Updated cache key for new prompt structure
    const cachedData = getFromCache<string>(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    const prompt = `Create a highly detailed and comprehensive image generation prompt for an AI art generator. The goal is to produce a rich, textbook-quality educational infographic that visually explains the physics concept of "${topic}" from the chapter "${chapter}".
    
    The prompt must describe a scene containing:
    1. A central, high-resolution scientific diagram or 3D visualization of the core concept (e.g., apparatus, particle interaction, field configuration).
    2. Educational annotations described visually: include specific details like "labeled vectors", "force arrows in contrasting colors", "graphical overlays", "flow lines", or "exploded view components".
    3. A clean, professional aesthetic suitable for a physics textbook or high-end educational software.
    4. Keywords to include: "Educational infographic, scientific illustration, high detail, 8k, photorealistic 3D render, schematic labels, textbook quality, clean background, physics diagram".
    
    The output must be a single, dense paragraph of descriptive keywords and phrases that covers at least 70% of the topic's educational details visually. Do not add any conversational text or explanations, only the image prompt.`;

    try {
        const response = await makeApiCall<GenerateContentResponse>(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                safetySettings: defaultSafetySettings,
                thinkingConfig: { thinkingBudget: 0 }
            },
        }));
        const result = response.text.trim();
        saveToCache(cacheKey, result);
        return result;
    } catch (error) {
        console.error("Error fetching visualization prompt from Gemini API:", error);
        return "";
    }
}

export async function getTextToSpeech(textToSpeak: string): Promise<string | null> {
    if (!textToSpeak || textToSpeak.trim().length === 0) {
        return null;
    }
    try {
        // Use makeApiCall for retry logic
        const response = await makeApiCall<GenerateContentResponse>(() => ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            // Removed "Say clearly: " to reduce processing time/tokens
            contents: [{ parts: [{ text: textToSpeak }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        // FIX: Changed from 'Puck' to 'Kore' for a more standard/normal English voice.
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
                safetySettings: defaultSafetySettings
            },
        }));
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (error) {
        console.error("Error generating speech from Gemini API:", error);
        return null;
    }
}