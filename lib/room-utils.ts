// Generate a 6-digit room ID
export function generateRoomId(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Validate if a string is a valid 6-digit room ID
export function isValidRoomId(roomId: string): boolean {
  return /^\d{6}$/.test(roomId);
}
