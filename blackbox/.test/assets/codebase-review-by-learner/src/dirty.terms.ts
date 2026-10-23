/**
 * .what = a surfer's reserved slot in a surf lesson
 */
export interface Reservation {
  surfer: string;
  slot: string;
}

/**
 * .what = gets a surfer's reserved slot in a surf lesson
 */
export const getHold = (input: { id: string }): Reservation => {
  return { surfer: 'kai', slot: '9am' };
};

/**
 * .what = cancels a surfer's reserved slot in a surf lesson
 */
export const cancelAppointment = (input: { reservation: Reservation }): void => {
  return;
};

/**
 * .what = a session — one surf lesson, in minutes
 */
export interface Session {
  lessonMinutes: number;
}

/**
 * .what = opens a session — one auth login, keyed by its token
 */
export const openSession = (input: { token: string }): { token: string } => {
  return { token: input.token };
};
