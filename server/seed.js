const mongoose = require('mongoose');
require('dotenv').config();
const Question = require('./src/models/Question');

const questions = [
  {
    title: 'Hello World (Python)',
    slug: 'hello-world-py',
    buggyCode: 'print("Hello World"',
    correctSolution: 'print("Hello World!")',
    difficulty: 'Easy',
    language: 'python',
    judge0LanguageId: 71,
    hiddenTestCases: [{ input: '', expectedOutput: 'Hello World!\n' }],
    xpReward: 10
  },
  {
    title: 'Hello World (C)',
    slug: 'hello-world-c',
    buggyCode: '#include <stdio.h>\n\nint main() {\n    printf("Hello World!")\n    return 0;\n}',
    correctSolution: '#include <stdio.h>\n\nint main() {\n    printf("Hello World!\\n");\n    return 0;\n}',
    difficulty: 'Easy',
    language: 'c',
    judge0LanguageId: 50,
    hiddenTestCases: [{ input: '', expectedOutput: 'Hello World!\n' }],
    xpReward: 15
  }
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    await Question.deleteMany();
    await Question.insertMany(questions);
    console.log('Questions seeded successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
