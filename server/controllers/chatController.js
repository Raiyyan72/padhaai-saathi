const {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} = require("@google/genai");

require("dotenv").config();

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

const Chat = require("../models/Chat");
const Progress = require("../models/progress");


// ======================================================
// GEMINI
// ======================================================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


// ======================================================
// GEMINI FILE CACHE
// ======================================================
//
// Same user + same file = reuse Gemini file
//
// This prevents uploading the same PDF/image to Gemini
// again and again during the current server session.
//
// Example:
//
// User uploads PDF
//      ↓
// Gemini upload
//      ↓
// URI cached
//      ↓
// User asks another question with same PDF
//      ↓
// Cached URI reused
//
// ======================================================

const geminiFileCache = new Map();


// ======================================================
// CREATE FILE HASH
// ======================================================

const getFileHash = (buffer) => {
  return crypto
    .createHash("sha256")
    .update(buffer)
    .digest("hex");
};


// ======================================================
// WAIT FOR GEMINI FILE
// ======================================================

const waitForGeminiFile = async (file) => {
  let currentFile = file;

  for (let i = 0; i < 30; i++) {
    const state =
      currentFile?.state?.name ||
      currentFile?.state;

    console.log(
      `📂 Gemini File State [${i + 1}]:`,
      state || "UNKNOWN"
    );

    // If state is missing, assume file is usable.
    if (!state || state === "ACTIVE") {
      return currentFile;
    }

    if (state === "FAILED") {
      throw new Error(
        "Gemini failed to process the uploaded file."
      );
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });

    currentFile = await ai.files.get({
      name: currentFile.name,
    });
  }

  throw new Error(
    "Gemini file processing timed out."
  );
};


// ======================================================
// UPLOAD FILE TO GEMINI
// ======================================================

const uploadFileToGemini = async (
  file,
  userId
) => {
  const fileHash = getFileHash(
    file.buffer
  );

  const cacheKey =
    `${userId}_${fileHash}`;


  // --------------------------------------------------
  // CHECK CACHE
  // --------------------------------------------------

  const cachedFile =
    geminiFileCache.get(cacheKey);


  if (cachedFile) {
    console.log("");
    console.log(
      "⚡ ==============================="
    );
    console.log(
      "⚡ REUSING CACHED GEMINI FILE"
    );
    console.log(
      "📄 File:",
      file.originalname
    );
    console.log(
      "🔑 Hash:",
      fileHash
    );
    console.log(
      "🔗 URI:",
      cachedFile.uri
    );
    console.log(
      "⚡ NO GEMINI RE-UPLOAD"
    );
    console.log(
      "⚡ ==============================="
    );
    console.log("");

    return cachedFile;
  }


  // --------------------------------------------------
  // CREATE TEMP DIRECTORY
  // --------------------------------------------------

  const tempDirectory =
    path.join(
      os.tmpdir(),
      "padhaai-saathi"
    );


  await fs.promises.mkdir(
    tempDirectory,
    {
      recursive: true,
    }
  );


  // --------------------------------------------------
  // SAFE TEMP FILE NAME
  // --------------------------------------------------

  const safeFileName =
    `${Date.now()}-${crypto
      .randomBytes(8)
      .toString("hex")}-${file.originalname
      .replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      )}`;


  const tempFilePath =
    path.join(
      tempDirectory,
      safeFileName
    );


  try {

    // ------------------------------------------------
    // WRITE FILE ASYNC
    // ------------------------------------------------

    await fs.promises.writeFile(
      tempFilePath,
      file.buffer
    );


    console.log("");
    console.log(
      "📤 ==============================="
    );
    console.log(
      "📤 NEW FILE UPLOAD"
    );
    console.log(
      "📄 Name:",
      file.originalname
    );
    console.log(
      "📦 Type:",
      file.mimetype
    );
    console.log(
      "📏 Size:",
      file.size,
      "bytes"
    );
    console.log(
      "🔑 Hash:",
      fileHash
    );
    console.log(
      "📤 Uploading to Gemini..."
    );
    console.log(
      "📤 ==============================="
    );


    const uploadStart =
      Date.now();


    // ------------------------------------------------
    // GEMINI FILES API
    // ------------------------------------------------

    const uploadedFile =
      await ai.files.upload({
        file: tempFilePath,

        config: {
          mimeType:
            file.mimetype,
        },
      });


    console.log(
      "☁️ Gemini upload complete"
    );


    console.log(
      "🆔 Gemini File:",
      uploadedFile.name
    );


    console.log(
      "🔗 Gemini URI:",
      uploadedFile.uri
    );


    console.log(
      "📦 Gemini MIME:",
      uploadedFile.mimeType
    );


    // ------------------------------------------------
    // WAIT FOR ACTIVE
    // ------------------------------------------------

    const processedFile =
      await waitForGeminiFile(
        uploadedFile
      );


    const uploadTime =
      Date.now() - uploadStart;


    console.log(
      `⚡ FILE PREPARATION TIME: ${uploadTime} ms`
    );


    // ------------------------------------------------
    // STORE ONLY REQUIRED DATA
    // ------------------------------------------------

    const cachedData = {
      name:
        processedFile.name,

      uri:
        processedFile.uri,

      mimeType:
        processedFile.mimeType ||
        file.mimetype,

      hash:
        fileHash,

      uploadedAt:
        Date.now(),
    };


    geminiFileCache.set(
      cacheKey,
      cachedData
    );


    console.log(
      "💾 Gemini file cached"
    );


    console.log(
      "📊 Current cached files:",
      geminiFileCache.size
    );


    return cachedData;

  } finally {

    // ------------------------------------------------
    // DELETE TEMP FILE
    // ------------------------------------------------

    try {

      if (
        await fs.promises
          .access(tempFilePath)
          .then(() => true)
          .catch(() => false)
      ) {

        await fs.promises.unlink(
          tempFilePath
        );

        console.log(
          "🧹 Temporary file deleted"
        );
      }

    } catch (deleteError) {

      console.warn(
        "⚠️ Could not delete temporary file:",
        deleteError.message
      );
    }
  }
};


// ======================================================
// SEND MESSAGE
// ======================================================


const Settings = require("../models/settings");


// ==================================================
// SEND MESSAGE
// ==================================================

const sendMessage = async (req, res) => {

    try {

        const {
            message,
            mode,
        } = req.body;


        const file = req.file;


        // ==================================================
        // VALIDATION
        // ==================================================

        if (
            (!message || !message.trim()) &&
            !file
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Message or file is required",

            });

        }


        // ==================================================
        // USER ID
        // ==================================================

        const userId =
            req.user.id;


        // ==================================================
        // GET USER SETTINGS
        // ==================================================

        let userSettings =
            await Settings.findOne({
                userId: userId
            });


        // ==================================================
        // CREATE DEFAULT SETTINGS
        // ==================================================

        if (!userSettings) {

            userSettings =
                await Settings.create({

                    userId: userId,

                    responseStyle:
                        "balanced",

                    studyLevel:
                        "intermediate",

                    explanationMode:
                        "standard",

                });

        }


        console.log("");

        console.log(
            "⚙️ ==============================="
        );

        console.log(
            "⚙️ USER SETTINGS"
        );

        console.log(
            "⚙️ Response Style:",
            userSettings.responseStyle
        );

        console.log(
            "⚙️ Study Level:",
            userSettings.studyLevel
        );

        console.log(
            "⚙️ Explanation Mode:",
            userSettings.explanationMode
        );

        console.log(
            "⚙️ ==============================="
        );

        console.log("");


        // ==================================================
        // BUILD AI PREFERENCE
        // ==================================================

        let preferencePrompt = "";


        // --------------------------------------------------
        // RESPONSE STYLE
        // --------------------------------------------------

        if (
            userSettings.responseStyle ===
            "concise"
        ) {

            preferencePrompt +=
                `
Keep the answer concise and to the point.
Avoid unnecessary information.
`;

        }

        else if (
            userSettings.responseStyle ===
            "detailed"
        ) {

            preferencePrompt +=
                `
Give a detailed explanation.
Include useful examples when appropriate.
Cover the important points clearly.
`;

        }

        else {

            preferencePrompt +=
                `
Give a balanced explanation.
Provide enough detail to understand the topic
without making the answer unnecessarily long.
`;

        }


        // --------------------------------------------------
        // STUDY LEVEL
        // --------------------------------------------------

        if (
            userSettings.studyLevel ===
            "beginner"
        ) {

            preferencePrompt +=
                `
The student is a beginner.
Use simple language and explain basic concepts clearly.
Avoid assuming advanced prior knowledge.
`;

        }

        else if (
            userSettings.studyLevel ===
            "advanced"
        ) {

            preferencePrompt +=
                `
The student has an advanced level.
You may use deeper technical concepts,
advanced terminology and detailed reasoning when useful.
`;

        }

        else {

            preferencePrompt +=
                `
The student is at an intermediate level.
Explain concepts clearly while including useful technical details.
`;

        }


        // --------------------------------------------------
        // EXPLANATION MODE
        // --------------------------------------------------

        if (
            userSettings.explanationMode ===
            "simple"
        ) {

            preferencePrompt +=
                `
Use simple language and easy examples.
Make difficult concepts easy to understand.
`;

        }

        else if (
            userSettings.explanationMode ===
            "step-by-step"
        ) {

            preferencePrompt +=
                `
Explain the solution step-by-step.
Break complex problems into smaller steps.
Include examples where useful.
`;

        }

        else {

            preferencePrompt +=
                `
Use a clear and structured explanation.
Organize the answer logically.
`;

        }


        // ==================================================
        // FILE LOGS
        // ==================================================

        if (file) {

            console.log("");

            console.log(
                "📎 ==============================="
            );

            console.log(
                "📎 FILE RECEIVED"
            );

            console.log(
                "📄 Name:",
                file.originalname
            );

            console.log(
                "📦 Type:",
                file.mimetype
            );

            console.log(
                "📏 Size:",
                file.size,
                "bytes"
            );

            console.log(
                "📎 ==============================="
            );

            console.log("");

        }


        // ==================================================
        // BASE PROMPT
        // ==================================================

        let prompt =
            message?.trim() ||
            "Please analyze this file carefully and explain its contents.";


        // ==================================================
        // QUIZ MODE
        // ==================================================

        if (mode === "quiz") {

            prompt = `

You are an AI Quiz Generator.

USER PREFERENCES:

${preferencePrompt}

Create exactly 10 multiple-choice questions about:

${message || "the attached file"}

Return ONLY valid JSON.

Use this exact format:

{
  "questions": [
    {
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "answer": 0
    }
  ]
}

Rules:

- Exactly 10 questions
- Exactly 4 options for every question
- answer must be 0, 1, 2, or 3
- Only one correct answer
- No explanations
- No markdown
- No code block
- No extra text

`;

        }


        // ==================================================
        // NOTES MODE
        // ==================================================

        else if (mode === "notes") {

            prompt = `

You are Padhaai Saathi,
an AI Study Assistant.

USER PREFERENCES:

${preferencePrompt}

Prepare clear and useful study notes.

Topic:

${message}

Requirements:

- Use clear headings
- Use bullet points
- Highlight important concepts
- Include examples when useful
- Follow the student's study level
- Follow the requested explanation style
- Keep the notes useful for revision

`;

        }


        // ==================================================
        // PLANNER MODE
        // ==================================================

        else if (mode === "planner") {

            prompt = `

You are Padhaai Saathi,
an AI Study Planner.

USER PREFERENCES:

${preferencePrompt}

Create a practical study plan.

Goal:

${message}

Include:

- Topics
- Daily tasks
- Revision
- Practice
- Recommended study order
- Realistic workload

Make the plan appropriate for
the student's study level.

`;

        }


        // ==================================================
        // NORMAL CHAT
        // ==================================================

        else {

            prompt = `

You are Padhaai Saathi,
an AI study assistant.

USER PREFERENCES:

${preferencePrompt}

IMPORTANT:

Follow the user's preferences while answering.

User's question:

${message}

Answer clearly and helpfully.

`;

        }


        // ==================================================
        // CONTENT
        // ==================================================

        let contents;


        // ==================================================
        // FILE REQUEST
        // ==================================================

        if (file) {

            const fileStart =
                Date.now();


            // ------------------------------------------------
            // UPLOAD / REUSE GEMINI FILE
            // ------------------------------------------------

            const geminiFile =
                await uploadFileToGemini(
                    file,
                    userId
                );


            const fileTime =
                Date.now() - fileStart;


            console.log(
                `⚡ FILE TOTAL TIME: ${fileTime} ms`
            );


            // ------------------------------------------------
            // CREATE FILE PART
            // ------------------------------------------------

            const filePart =
                createPartFromUri(

                    geminiFile.uri,

                    geminiFile.mimeType ||
                    file.mimetype

                );


            // ------------------------------------------------
            // FILE PROMPT
            // ------------------------------------------------

            const filePrompt = `

You are Padhaai Saathi,
an AI study assistant.

A user has attached a file.

USER PREFERENCES:

${preferencePrompt}

IMPORTANT:

- Carefully inspect the attached file.
- Base your answer on the actual attached file.
- Do NOT guess the contents.
- If it is a PDF, read the PDF content.
- If it is an image, analyze the image.
- If the file contains text, use that text.
- Answer the user's request clearly.
- Follow the user's response style.
- Follow the user's study level.
- Follow the user's explanation mode.

USER REQUEST:

${prompt}

`;


            contents =
                createUserContent([

                    filePart,

                    "\n\n",

                    filePrompt,

                ]);


            console.log(
                "📎 Gemini file part prepared"
            );

        }


        // ==================================================
        // NORMAL TEXT REQUEST
        // ==================================================

        else {

            contents =
                prompt;

        }


        // ==================================================
        // GEMINI CONFIG
        // ==================================================

        let config = {};


        // ==================================================
        // QUIZ JSON CONFIG
        // ==================================================

        if (mode === "quiz") {

            config = {

                responseMimeType:
                    "application/json",

                responseSchema: {

                    type: "object",

                    properties: {

                        questions: {

                            type: "array",

                            minItems: 10,

                            maxItems: 10,

                            items: {

                                type: "object",

                                properties: {

                                    question: {

                                        type: "string",

                                    },

                                    options: {

                                        type: "array",

                                        minItems: 4,

                                        maxItems: 4,

                                        items: {

                                            type: "string",

                                        },

                                    },

                                    answer: {

                                        type: "integer",

                                        minimum: 0,

                                        maximum: 3,

                                    },

                                },

                                required: [

                                    "question",

                                    "options",

                                    "answer",

                                ],

                            },

                        },

                    },

                    required: [

                        "questions",

                    ],

                },

            };

        }


        // ==================================================
        // LOGS
        // ==================================================

        console.log("");

        console.log(
            "🔥 ==============================="
        );

        console.log(
            "🔥 MODE:",
            mode
        );

        console.log(
            "🔥 RESPONSE STYLE:",
            userSettings.responseStyle
        );

        console.log(
            "🔥 STUDY LEVEL:",
            userSettings.studyLevel
        );

        console.log(
            "🔥 EXPLANATION MODE:",
            userSettings.explanationMode
        );

        console.log(
            "🔥 PROMPT:",
            prompt
        );

        console.log(
            "📎 FILE ATTACHED:",
            file
                ? file.originalname
                : "NO"
        );

        console.log(
            "🔥 MODEL: gemini-3.5-flash"
        );

        console.log(
            "🔥 ==============================="
        );

        console.log("");


        // ==================================================
        // GEMINI GENERATION
        // ==================================================

        const generationStart =
            Date.now();


        const result =
            await ai.models.generateContent({

                model:
                    "gemini-3.5-flash",

                contents:
                    contents,

                config:
                    config,

            });


        const generationTime =
            Date.now() -
            generationStart;


        const response =
            result.text;


        console.log(
            `⚡ GEMINI GENERATION TIME: ${generationTime} ms`
        );


        console.log(
            "🔥 GEMINI RESPONSE:",
            response
        );


        // ==================================================
        // SAVE CHAT
        // ==================================================

        const chat =
            await Chat.create({

                userId:
                    userId,

                message:
                    file

                        ? `${message?.trim() || "File analysis"}\n📎 ${file.originalname}`.trim()

                        : message.trim(),

                response:
                    response,

            });


        console.log(
            "💾 CHAT SAVED:",
            chat._id
        );


        // ==================================================
        // PROGRESS
        // ==================================================

        const now =
            new Date();


        const today =
            new Date(

                now.getFullYear(),

                now.getMonth(),

                now.getDate()

            );


        let progress =
            await Progress.findOne({

                userId:
                    userId,

            });


        // ==================================================
        // CREATE PROGRESS
        // ==================================================

        if (!progress) {

            progress =
                await Progress.create({

                    userId:
                        userId,

                    studySessions:
                        1,

                    questionsAsked:
                        1,

                    studyMinutes:
                        2,

                    currentStreak:
                        1,

                    lastStudyDate:
                        now,

                });


            console.log(
                "📊 PROGRESS CREATED:",
                {

                    studySessions:
                        progress.studySessions,

                    questionsAsked:
                        progress.questionsAsked,

                    studyMinutes:
                        progress.studyMinutes,

                    currentStreak:
                        progress.currentStreak,

                }
            );

        }


        // ==================================================
        // UPDATE PROGRESS
        // ==================================================

        else {

            progress.studySessions +=
                1;

            progress.questionsAsked +=
                1;

            progress.studyMinutes +=
                2;


            let streak =
                progress.currentStreak ||
                0;


            if (
                !progress.lastStudyDate
            ) {

                streak = 1;

            }

            else {

                const lastDate =
                    new Date(
                        progress.lastStudyDate
                    );


                const lastStudyDay =
                    new Date(

                        lastDate.getFullYear(),

                        lastDate.getMonth(),

                        lastDate.getDate()

                    );


                const difference =
                    Math.floor(

                        (
                            today -
                            lastStudyDay
                        ) /
                        (
                            1000 *
                            60 *
                            60 *
                            24
                        )

                    );


                if (
                    difference === 0
                ) {

                    streak =
                        streak || 1;

                }

                else if (
                    difference === 1
                ) {

                    streak += 1;

                }

                else {

                    streak = 1;

                }

            }


            progress.currentStreak =
                streak;


            progress.lastStudyDate =
                now;


            await progress.save();


            console.log(
                "📊 PROGRESS UPDATED:",
                {

                    studySessions:
                        progress.studySessions,

                    questionsAsked:
                        progress.questionsAsked,

                    studyMinutes:
                        progress.studyMinutes,

                    currentStreak:
                        progress.currentStreak,

                }
            );

        }


        // ==================================================
        // RESPONSE
        // ==================================================

        res.status(200).json({

            success:
                true,

            chat:
                chat,

        });


    }

    catch (error) {

        console.error("");

        console.error(
            "❌ ==============================="
        );

        console.error(
            "❌ GEMINI / CHAT ERROR"
        );

        console.error(
            "❌ Message:",
            error.message
        );

        console.error(
            "❌ Full Error:",
            error
        );

        console.error(
            "❌ ==============================="
        );


        res.status(500).json({

            success:
                false,

            message:
                error.message ||
                "Unable to process chat request",

        });

    }

};


// ==================================================
// EXPORT
// ==================================================

module.exports = {
    sendMessage,
};
// ======================================================
// GET CHAT HISTORY
// ======================================================

const getChatHistory = async (
  req,
  res
) => {

  try {

    console.log(
      "🔥 HISTORY USER:",
      req.user
    );


    const chats =
      await Chat.find({
        userId:
          req.user.id,
      })
        .sort({
          createdAt:
            -1,
        });


    console.log(
      "🔥 HISTORY COUNT:",
      chats.length
    );


    res.status(200).json({

      success:
        true,

      chats:
        chats,
    });


  } catch (error) {

    console.error(
      "❌ Chat History Error:",
      error
    );


    res.status(500).json({

      success:
        false,

      message:
        "Unable to fetch chat history",
    });
  }
};


// ======================================================
// GET CHAT STATS
// ======================================================

const getChatStats = async (
  req,
  res
) => {

  try {

    const userId =
      req.user.id;


    // --------------------------------------------------
    // TOTAL CHATS
    // --------------------------------------------------

    const totalChats =
      await Chat.countDocuments({
        userId:
          userId,
      });


    // --------------------------------------------------
    // TODAY
    // --------------------------------------------------

    const startOfToday =
      new Date();


    startOfToday.setHours(
      0,
      0,
      0,
      0
    );


    const todayChats =
      await Chat.countDocuments({
        userId:
          userId,

        createdAt: {
          $gte:
            startOfToday,
        },
      });


    // --------------------------------------------------
    // START OF WEEK
    // --------------------------------------------------

    const startOfWeek =
      new Date();


    const day =
      startOfWeek.getDay();


    const diff =
      day === 0
        ? 6
        : day - 1;


    startOfWeek.setDate(
      startOfWeek.getDate() -
        diff
    );


    startOfWeek.setHours(
      0,
      0,
      0,
      0
    );


    // --------------------------------------------------
    // WEEKLY CHATS
    // --------------------------------------------------

    const weeklyChats =
      await Chat.countDocuments({
        userId:
          userId,

        createdAt: {
          $gte:
            startOfWeek,
        },
      });


    // --------------------------------------------------
    // WEEKLY ACTIVITY
    // --------------------------------------------------

    const weeklyActivity =
      await Chat.aggregate([

        {
          $match: {

            userId:
              new mongoose.Types.ObjectId(
                userId
              ),

            createdAt: {
              $gte:
                startOfWeek,
            },
          },
        },

        {
          $group: {

            _id: {

              $dateToString: {

                format:
                  "%Y-%m-%d",

                date:
                  "$createdAt",

                timezone:
                  "Asia/Kolkata",
              },
            },

            count: {
              $sum: 1,
            },

            minutes: {
              $sum: 2,
            },
          },
        },

        {
          $sort: {
            _id:
              1,
          },
        },
      ]);


    console.log(
      "📈 WEEKLY ACTIVITY:",
      weeklyActivity
    );


    // --------------------------------------------------
    // STUDY DAYS
    // --------------------------------------------------

    const studyDaysData =
      await Chat.aggregate([

        {
          $match: {

            userId:
              new mongoose.Types.ObjectId(
                userId
              ),
          },
        },

        {
          $group: {

            _id: {

              $dateToString: {

                format:
                  "%Y-%m-%d",

                date:
                  "$createdAt",

                timezone:
                  "Asia/Kolkata",
              },
            },
          },
        },
      ]);


    const studyDays =
      studyDaysData.length;


    console.log(
      "🔥 STUDY DAYS COUNT:",
      studyDays
    );


    // --------------------------------------------------
    // PROGRESS
    // --------------------------------------------------

    const progress =
      await Progress.findOne({
        userId:
          userId,
      });


    console.log(
      "📊 CHAT STATS:",
      {
        totalChats,
        todayChats,
        weeklyChats,
        studyDays,
        progress,
        weeklyActivity,
      }
    );


    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    res.status(200).json({

      success:
        true,

      stats: {

        totalChats,

        todayChats,

        weeklyChats,

        studyDays,

        weeklyActivity,

        studySessions:
          progress?.studySessions ||
          0,

        questionsAsked:
          progress?.questionsAsked ||
          0,

        studyMinutes:
          progress?.studyMinutes ||
          0,

        currentStreak:
          progress?.currentStreak ||
          0,

        lastStudyDate:
          progress?.lastStudyDate ||
          null,
      },
    });


  } catch (error) {

    console.error(
      "❌ Chat Stats Error:",
      error
    );


    res.status(500).json({

      success:
        false,

      message:
        "Unable to fetch chat stats",
    });
  }
};


// ======================================================
// DELETE ALL CHAT HISTORY
// ======================================================

const deleteChatHistory = async (
  req,
  res
) => {

  try {

    const result =
      await Chat.deleteMany({
        userId:
          req.user.id,
      });


    console.log(
      "🗑️ DELETED CHATS:",
      result.deletedCount
    );


    res.status(200).json({

      success:
        true,

      message:
        "Chat history deleted successfully",

      deletedCount:
        result.deletedCount,
    });


  } catch (error) {

    console.error(
      "❌ Delete History Error:",
      error
    );


    res.status(500).json({

      success:
        false,

      message:
        "Unable to delete chat history",
    });
  }
};


// ======================================================
// DELETE SINGLE CHAT
// ======================================================

const deleteSingleChat = async (
  req,
  res
) => {

  try {

    const chat =
      await Chat.findOneAndDelete({

        _id:
          req.params.id,

        userId:
          req.user.id,
      });


    if (!chat) {

      return res.status(404).json({

        success:
          false,

        message:
          "Chat not found",
      });
    }


    res.status(200).json({

      success:
        true,

      message:
        "Chat deleted successfully",
    });


  } catch (error) {

    console.error(
      "❌ Delete Single Chat Error:",
      error
    );


    res.status(500).json({

      success:
        false,

      message:
        "Unable to delete chat",
    });
  }
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {

  sendMessage,

  getChatHistory,

  getChatStats,

  deleteChatHistory,

  deleteSingleChat,
};

