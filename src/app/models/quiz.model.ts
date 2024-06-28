export interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
  }
  
  export interface QuizData {
    questions: QuizQuestion[];
  }
  