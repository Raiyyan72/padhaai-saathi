const Progress = require("../models/progress");


// ==========================================
// GET USER PROGRESS
// ==========================================

const getProgress = async (req, res) => {

  try {

    const userId = req.user.id;

    let progress = await Progress.findOne({
      userId: userId,
    });


    // Agar progress nahi hai to create karo

    if (!progress) {

      progress = await Progress.create({
        userId: userId,
      });

    }


    res.status(200).json({

      success: true,

      progress: progress,

    });


  } catch (error) {

    console.error("❌ Get Progress Error:", error);

    res.status(500).json({

      success: false,

      message: "Unable to load progress",

    });

  }

};



// ==========================================
// UPDATE PROGRESS
// ==========================================

const updateProgress = async (req, res) => {

  try {

    const userId = req.user.id;

    const {
      studySessions,
      questionsAsked,
      studyMinutes,
    } = req.body;


    let progress = await Progress.findOne({
      userId: userId,
    });


    // Create if doesn't exist

    if (!progress) {

      progress = await Progress.create({
        userId: userId,
      });

    }


    // ==========================================
    // UPDATE VALUES
    // ==========================================

    if (studySessions !== undefined) {

      progress.studySessions += Number(studySessions);

    }


    if (questionsAsked !== undefined) {

      progress.questionsAsked += Number(questionsAsked);
    }
if (studySessions !== undefined)
    progress.studySessions += Number(studySessions);

if (questionsAsked !== undefined)
    progress.questionsAsked += Number(questionsAsked);

if (studyMinutes !== undefined) {
    progress.studyMinutes += Number(studyMinutes);
}
    // ==========================================
    // STREAK
    // ==========================================

    const today = new Date();

    today.setHours(0, 0, 0, 0);


    if (!progress.lastStudyDate) {

      progress.currentStreak = 1;

    } else {

      const lastDate = new Date(progress.lastStudyDate);

      lastDate.setHours(0, 0, 0, 0);


      const difference =
        (today - lastDate) /
        (1000 * 60 * 60 * 24);


      if (difference === 1) {

        progress.currentStreak += 1;

      } else if (difference > 1) {

        progress.currentStreak = 1;

      }

    }


    progress.lastStudyDate = new Date();


    await progress.save();


    res.status(200).json({

      success: true,

      message: "Progress updated",

      progress: progress,

    });


  } catch (error) {

    console.error("❌ Update Progress Error:", error);

    res.status(500).json({

      success: false,

      message: "Unable to update progress",

    });

  }

};



module.exports = {

  getProgress,

  updateProgress,

};

