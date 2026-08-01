// deliberately term-dirty: names ONE concept — a surfer's reserved lesson slot — with THREE
// different words, and overloads one word for two concepts. used by the learner term-application
// acceptance case to prove the rubric detects inconsistency + ambiguity.

// inconsistency: one concept (a reserved lesson slot) under three words —
// 'Reservation' / 'hold' / 'appointment' — across three contract signatures.
export interface Reservation {
  surfer: string;
  slot: string;
}

export const getHold = (input: { id: string }): Reservation => {
  return { surfer: 'kai', slot: '9am' };
};

export const cancelAppointment = (input: { reservation: Reservation }): void => {
  // three words, one concept
};

// ambiguity (overload): 'session' means BOTH a surf lesson AND an auth login in one file.
export interface Session {
  lessonMinutes: number; // a surf-lesson session
}

export const openSession = (input: { token: string }): { token: string } => {
  return { token: input.token }; // an auth login session — same word, second concept
};
