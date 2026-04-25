const mongoose = require('mongoose');

async function debugAssessments() {
  await mongoose.connect('mongodb://localhost:27017/talentscreen');
  
  console.log('--- DEBUGGING ASSESSMENTS ---');
  
  const Assessment = mongoose.model('Assessment', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Candidate = mongoose.model('Candidate', new mongoose.Schema({}, { strict: false }));

  const assessments = await Assessment.find().lean();
  
  for (const a of assessments) {
    console.log(`\nAssessment ID: ${a._id}`);
    console.log(`- Job ID: ${a.jobId}`);
    console.log(`- Score: ${a.score}% (${a.correctAnswersCount}/${a.totalQuestionsCount})`);
    
    if (a.candidateId) {
      const user = await User.findById(a.candidateId);
      console.log(`- candidateId (User): ${a.candidateId} -> ${user ? user.name + ' (' + user.email + ')' : 'NOT FOUND IN USERS'}`);
    } else {
      console.log(`- candidateId: MISSING`);
    }

    if (a.talentId) {
      const candidate = await Candidate.findById(a.talentId);
      const userAsTalent = await User.findById(a.talentId);
      
      if (candidate) {
        console.log(`- talentId (Candidate): ${a.talentId} -> ${candidate.name} (${candidate.email})`);
      } else if (userAsTalent) {
        console.log(`- talentId (FOUND IN USERS INSTEAD): ${a.talentId} -> ${userAsTalent.name} (${userAsTalent.email})`);
      } else {
        console.log(`- talentId: ${a.talentId} -> NOT FOUND IN CANDIDATES OR USERS`);
      }
    } else {
      console.log(`- talentId: MISSING`);
    }
  }
  
  await mongoose.disconnect();
}

debugAssessments().catch(console.error);
