// Common everyday situations for the "give me a common situation" button.
// No AI call: the user composes them like any other intent.
import type { Relationship, Tone } from "./types";

export const PRACTICE_INTENTS: { intent: string; relationship: Relationship; tone: Tone }[] = [
  { intent: "Ask my classmate if I can borrow their notes from yesterday", relationship: "classmate", tone: "friendly" },
  { intent: "Tell my friend I'll be ten minutes late", relationship: "friend", tone: "casual" },
  { intent: "Thank my host family for picking me up at the station", relationship: "family", tone: "appreciative" },
  { intent: "Ask my teacher if I can hand in the essay on Monday instead", relationship: "teacher", tone: "polite" },
  { intent: "Invite my friend to get bubble tea after class", relationship: "friend", tone: "casual" },
  { intent: "Wish my classmate good luck for tomorrow's exam", relationship: "classmate", tone: "friendly" },
  { intent: "Tell my host mom I won't be home for dinner tonight", relationship: "family", tone: "polite" },
  { intent: "Ask a friend to send me the photos from the weekend", relationship: "friend", tone: "casual" },
  { intent: "Apologize to my teacher for missing class because I was sick", relationship: "teacher", tone: "polite" },
  { intent: "Congratulate my classmate on winning the competition", relationship: "classmate", tone: "friendly" },
  { intent: "Ask my host family what time breakfast is tomorrow", relationship: "family", tone: "polite" },
  { intent: "Tell my friend I loved the restaurant they recommended", relationship: "friend", tone: "appreciative" },
  { intent: "Quiero agradecerle a mi amigo por ayudarme con la tarea, sin sonar muy formal", relationship: "friend", tone: "casual" },
  { intent: "Preguntarle a mi profesor si podemos cambiar la reunión al jueves", relationship: "teacher", tone: "polite" },
];
