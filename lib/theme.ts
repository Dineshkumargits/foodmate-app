export const isChristmasTime = (): boolean => {
  const now = new Date()
  const month = now.getMonth() // 0-indexed (11 is December)
  const day = now.getDate()

  // December (11)
  if (month === 11) {
    return true
  }

  // January (0) 1st to 5th
  if (month === 0 && day <= 5) {
    return true
  }

  return false
}
